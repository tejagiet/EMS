import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function ITAssetsPortalPage() {
  const context = await verifyPortalAccess("it_assets_manager");

  return (
    <PortalShellView
      context={context}
      role="it_assets_manager"
      modules={[
        {
          title: "Hardware & Equipment Inventory",
          phase: 5,
          description:
            "Register laptops, workstations, peripherals, serial tags, and warranty states.",
        },
        {
          title: "Asset Allocation & Handover",
          phase: 5,
          description:
            "Assign equipment to employees with digital acknowledgment signatures and return audits.",
        },
        {
          title: "Software Licenses & Key Management",
          phase: 5,
          description:
            "Track enterprise software license allocations, renewal dates, and compliance seats.",
        },
      ]}
    />
  );
}
