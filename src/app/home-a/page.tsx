import DayBoard from "@/components/home-options/a/DayBoard";
import OptionSwitcher from "@/components/home-options/OptionSwitcher";
import { optionMetadata } from "@/components/home-options/optionMetadata";
import "@/components/home-options/shell.css";

export const metadata = optionMetadata("A", "The day board");

/** Homepage design option A, for the owner to compare with /home-b and /home-c. */
export default function HomeOptionA() {
  return (
    <>
      <DayBoard />
      <OptionSwitcher current="a" />
    </>
  );
}
