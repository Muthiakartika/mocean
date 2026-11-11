import "@/components/home-options/shell.css";
import ReelHome from "@/components/home-options/c/ReelHome";
import OptionSwitcher from "@/components/home-options/OptionSwitcher";
import { optionMetadata } from "@/components/home-options/optionMetadata";

export const metadata = optionMetadata("C", "Reel");

/** Homepage design option C (preview, not indexed). */
export default function HomeOptionC() {
  return (
    <>
      <ReelHome />
      <OptionSwitcher current="c" />
    </>
  );
}
