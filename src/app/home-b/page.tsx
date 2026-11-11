import "@/components/home-options/shell.css";
import ChartHome from "@/components/home-options/b/ChartHome";
import OptionSwitcher from "@/components/home-options/OptionSwitcher";
import { optionMetadata } from "@/components/home-options/optionMetadata";

export const metadata = optionMetadata("B", "Chart");

/** Homepage design option B: a nautical chart of the Alas Strait. */
export default function HomeOptionB() {
  return (
    <>
      <ChartHome />
      <OptionSwitcher current="b" />
    </>
  );
}
