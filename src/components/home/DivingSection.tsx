import { diving as content } from "@/data/homepage";
import FeatureSection from "./FeatureSection";

/** Section 4: "Diving at Mocean, Built by Divers". */
export default function DivingSection() {
  return (
    <FeatureSection
      variant="diving"
      sub={content.sub}
      title={content.title}
      paragraphs={content.paragraphs}
      link={content.link}
      button={content.button}
      image={content.image}
      band
    />
  );
}
