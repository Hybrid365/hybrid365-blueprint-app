/**
 * Reads public-schema structure from pg_catalog (no row data) and renders a staging baseline.
 * Callers must already be inside a READ ONLY transaction.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MAX_STAGING_MIGRATION = 21;

/** Ordered migration files allowed on staging: numbered 001..021. 022+ is refused. */
export function stagingMigrationPlan(migrationsDir) {
  const files = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort();
  const allowed = [];
  const refused = [];
  for (const name of files) {
    const number = Number.parseInt(name.split("_")[0], 10);
    if (!Number.isFinite(number)) refused.push({ name, reason: "no numeric prefix" });
    else if (number > MAX_STAGING_MIGRATION) refused.push({ name, reason: `above ${String(MAX_STAGING_MIGRATION).padStart(3, "0")}` });
    else allowed.push(name);
  }
  return { allowed, refused };
}

/** Tables and functions that the allowed migrations create themselves. */
export function migrationOwnedObjects(migrationsDir) {
  const tables = new Set();
  const functions = new Set();
  for (const name of stagingMigrationPlan(migrationsDir).allowed) {
    const sql = readFileSync(join(migrationsDir, name), "utf8");
    for (const match of sql.matchAll(/create table(?: if not exists)?\s+(?:public\.)?"?([a-z0-9_]+)"?/gi)) tables.add(match[1]);
    for (const match of sql.matchAll(/create (?:or replace )?function\s+(?:public\.)?"?([a-z0-9_]+)"?\s*\(/gi)) functions.add(match[1]);
  }
  return { tables, functions };
}

const BUILTIN_EXTENSIONS = new Set(["plpgsql"]);

export async function readCatalog(client) {
  const q = async (sql) => (await client.query(sql)).rows;

  const [version] = await q(`select current_setting('server_version') as version`);

  const extensions = await q(`
    select e.extname as name, n.nspname as schema
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace
    order by 1`);

  const enums = await q(`
    select t.typname as name, array_agg(e.enumlabel::text order by e.enumsortorder) as labels
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
    group by t.typname order by 1`);

  const tables = await q(`
    select c.oid::int as oid, c.relname as name, c.relkind as kind,
           c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
    order by c.relname`);

  const columns = await q(`
    select c.relname as table_name, a.attnum as position, a.attname as name,
           format_type(a.atttypid, a.atttypmod) as type, a.attnotnull as not_null,
           pg_get_expr(d.adbin, d.adrelid) as default_expr,
           a.attidentity as identity, a.attgenerated as generated
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where n.nspname = 'public' and c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped
    order by c.relname, a.attnum`);

  const constraints = await q(`
    select c.relname as table_name, con.conname as name, con.contype as type,
           pg_get_constraintdef(con.oid, true) as definition
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and con.contype in ('p', 'u', 'c', 'x', 'f')
    order by c.relname, con.contype, con.conname`);

  const indexes = await q(`
    select t.relname as table_name, i.relname as name, pg_get_indexdef(ix.indexrelid) as definition
    from pg_index ix
    join pg_class i on i.oid = ix.indexrelid
    join pg_class t on t.oid = ix.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and not exists (select 1 from pg_constraint con where con.conindid = ix.indexrelid and con.contype in ('p', 'u', 'x'))
    order by t.relname, i.relname`);

  const policies = await q(`
    select tablename as table_name, policyname as name, permissive, roles::text[] as roles, cmd, qual, with_check
    from pg_policies where schemaname = 'public'
    order by tablename, policyname`);

  const triggers = await q(`
    select c.relname as table_name, n.nspname as table_schema, t.tgname as name, pg_get_triggerdef(t.oid, true) as definition
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
    order by n.nspname, c.relname, t.tgname`);

  const functions = await q(`
    select p.proname as name, pg_get_function_identity_arguments(p.oid) as args,
           pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
    order by p.proname, 2`);

  const sequences = await q(`
    select c.relname as name, s.seqtypid::regtype::text as type, s.seqstart::text as start,
           s.seqincrement::text as increment,
           exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype in ('a', 'i')) as owned_by_column
    from pg_sequence s join pg_class c on c.oid = s.seqrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' order by 1`);

  const views = await q(`
    select c.relname as name, c.relkind as kind, pg_get_viewdef(c.oid, true) as definition
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm') order by 1`);

  return { version: version.version, extensions, enums, tables, columns, constraints, indexes, policies, triggers, functions, sequences, views };
}

/** Structure-only summary, stable across environments, for drift comparison. */
export function catalogSnapshot(catalog) {
  const byTable = {};
  for (const table of catalog.tables) {
    byTable[table.name] = { rls: table.rls, columns: {}, constraints: {}, indexes: [], policies: [], triggers: [] };
  }
  for (const column of catalog.columns) {
    const table = byTable[column.table_name];
    if (!table) continue;
    table.columns[column.name] = {
      type: column.type,
      notNull: column.not_null,
      default: column.default_expr ?? null,
      identity: column.identity || null,
      generated: column.generated || null,
    };
  }
  for (const constraint of catalog.constraints) byTable[constraint.table_name]?.constraints && (byTable[constraint.table_name].constraints[constraint.name] = constraint.definition);
  for (const index of catalog.indexes) byTable[index.table_name]?.indexes.push(index.name);
  for (const policy of catalog.policies) byTable[policy.table_name]?.policies.push(policy.name);
  for (const trigger of catalog.triggers) {
    if (trigger.table_schema === "public") byTable[trigger.table_name]?.triggers.push(trigger.name);
  }
  return {
    tables: byTable,
    functions: [...new Set(catalog.functions.map((fn) => `${fn.name}(${fn.args})`))].sort(),
    enums: Object.fromEntries(catalog.enums.map((e) => [e.name, e.labels])),
    authUserTriggers: catalog.triggers.filter((t) => t.table_schema === "auth").map((t) => t.name),
    extensions: catalog.extensions.map((e) => e.name).sort(),
    views: catalog.views.map((v) => v.name).sort(),
  };
}

const ident = (name) => (/^[a-z_][a-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`);

function policySql(policy) {
  const roles = (policy.roles ?? []).map((role) => (role === "public" ? "public" : ident(role))).join(", ") || "public";
  let sql = `create policy ${ident(policy.name)} on public.${ident(policy.table_name)}\n  as ${policy.permissive.toLowerCase()} for ${policy.cmd.toLowerCase()} to ${roles}`;
  if (policy.qual) sql += `\n  using (${policy.qual})`;
  if (policy.with_check) sql += `\n  with check (${policy.with_check})`;
  return `drop policy if exists ${ident(policy.name)} on public.${ident(policy.table_name)};\n${sql};`;
}

function referencesUserFunction(expr) {
  return Boolean(expr) && /\bpublic\.[a-z0-9_]+\s*\(/i.test(expr);
}

/**
 * Baseline for objects the migration chain assumes but does not create.
 * `pre` runs before 001 (types, base tables, their functions); `post` runs after 020
 * (base-table foreign keys, indexes, RLS, policies, triggers, auth.users triggers, views).
 */
export function renderBaseline(catalog, owned, { source }) {
  const baseTables = catalog.tables.filter((table) => !owned.tables.has(table.name));
  const baseNames = new Set(baseTables.map((table) => table.name));
  const baseFunctions = catalog.functions.filter((fn) => !owned.functions.has(fn.name));
  const header = (part) =>
    [
      `-- Hybrid365 staging baseline (${part}). Generated from ${source}; structure only, no rows.`,
      "-- Staging only. Never apply to production. Regenerate with scripts/staging/dump-production-schema.mjs.",
      `-- Server ${catalog.version}. Base tables: ${baseTables.map((t) => t.name).join(", ") || "none"}.`,
      "",
    ].join("\n");

  const pre = [header("pre: before migration 001"), "set check_function_bodies = off;", ""];

  for (const extension of catalog.extensions) {
    if (BUILTIN_EXTENSIONS.has(extension.name)) continue;
    pre.push(`create extension if not exists ${ident(extension.name)} with schema ${ident(extension.schema)};`);
  }
  pre.push("");

  for (const type of catalog.enums) {
    const labels = type.labels.map((label) => `'${label.replace(/'/g, "''")}'`).join(", ");
    pre.push(`do $$ begin\n  create type public.${ident(type.name)} as enum (${labels});\nexception when duplicate_object then null;\nend $$;`);
  }

  for (const sequence of catalog.sequences) {
    if (sequence.owned_by_column) continue;
    pre.push(`create sequence if not exists public.${ident(sequence.name)} as ${sequence.type} start ${sequence.start} increment ${sequence.increment};`);
  }

  const deferredDefaults = [];
  for (const table of baseTables) {
    const lines = [];
    for (const column of catalog.columns.filter((c) => c.table_name === table.name)) {
      let line = `  ${ident(column.name)} ${column.type}`;
      if (column.identity === "a") line += " generated always as identity";
      else if (column.identity === "d") line += " generated by default as identity";
      else if (column.generated === "s") line += ` generated always as (${column.default_expr}) stored`;
      else if (column.default_expr) {
        if (referencesUserFunction(column.default_expr)) deferredDefaults.push(`alter table public.${ident(table.name)} alter column ${ident(column.name)} set default ${column.default_expr};`);
        else if (/nextval\('/.test(column.default_expr)) line = `  ${ident(column.name)} ${column.type === "bigint" ? "bigserial" : column.type === "smallint" ? "smallserial" : "serial"}`;
        else line += ` default ${column.default_expr}`;
      }
      if (column.not_null) line += " not null";
      lines.push(line);
    }
    for (const constraint of catalog.constraints.filter((c) => c.table_name === table.name && c.type !== "f")) {
      lines.push(`  constraint ${ident(constraint.name)} ${constraint.definition}`);
    }
    pre.push(`\ncreate table if not exists public.${ident(table.name)} (\n${lines.join(",\n")}\n);`);
  }

  pre.push("");
  for (const fn of baseFunctions) pre.push(`${fn.definition.trim()};\n`);
  if (deferredDefaults.length) pre.push(deferredDefaults.join("\n"));

  const post = [header("post: after migration 020"), "set check_function_bodies = off;", ""];

  for (const constraint of catalog.constraints.filter((c) => baseNames.has(c.table_name) && c.type === "f")) {
    post.push(
      `do $$ begin\n  alter table public.${ident(constraint.table_name)} add constraint ${ident(constraint.name)} ${constraint.definition};\nexception when duplicate_object then null;\nend $$;`
    );
  }
  for (const index of catalog.indexes.filter((i) => baseNames.has(i.table_name))) {
    post.push(`${index.definition.replace(/^CREATE (UNIQUE )?INDEX /, "CREATE $1INDEX IF NOT EXISTS ")};`);
  }
  for (const table of baseTables) {
    if (table.rls) post.push(`alter table public.${ident(table.name)} enable row level security;`);
    if (table.force_rls) post.push(`alter table public.${ident(table.name)} force row level security;`);
  }
  for (const policy of catalog.policies.filter((p) => baseNames.has(p.table_name))) post.push(policySql(policy));
  for (const trigger of catalog.triggers) {
    const onBaseTable = trigger.table_schema === "public" && baseNames.has(trigger.table_name);
    const onAuthUsers = trigger.table_schema === "auth";
    if (!onBaseTable && !onAuthUsers) continue;
    post.push(`drop trigger if exists ${ident(trigger.name)} on ${trigger.table_schema}.${ident(trigger.table_name)};\n${trigger.definition};`);
  }
  for (const view of catalog.views) {
    const kind = view.kind === "m" ? "materialized view" : "view";
    const create = view.kind === "m" ? `create materialized view if not exists` : `create or replace view`;
    post.push(`${create} public.${ident(view.name)} as\n${view.definition.trim().replace(/;$/, "")};`);
    if (kind === "view") post.push("");
  }

  return {
    pre: `${pre.join("\n")}\n`,
    post: `${post.join("\n")}\n`,
    baseTables: baseTables.map((t) => t.name),
    baseFunctions: baseFunctions.map((f) => f.name),
  };
}
