import BoxCrossSkiAdminClient from "./BoxCrossSkiAdminClient";

export const metadata = {
  title: "BoxCross Ski Challenge Admin",
  description: "Authorised entry management for the BoxCross 1KM Ski Challenge.",
  robots: { index: false, follow: false },
};

export default function BoxCrossSkiAdminPage() {
  return <BoxCrossSkiAdminClient />;
}
