import { type NetworkTheater, SuchmodusCockpit } from "@/components/suchmodus/suchmodus-cockpit";

export function ViewerCockpitShell({ networkTheaters }: { networkTheaters: NetworkTheater[] }) {
  return <SuchmodusCockpit networkTheaters={networkTheaters} />;
}
