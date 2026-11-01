import { accommodation as content } from "@/data/homepage";
import FeatureSection from "./FeatureSection";

/** Section 3: "Bungalows and Rooms by the Beach". */
export default function Accommodation() {
  return (
    <FeatureSection
      variant="rooms"
      sub={content.sub}
      title={content.title}
      paragraphs={content.text}
      asParagraphs={false}
      button={content.button}
      image={content.image}
    />
  );
}
