import { restaurant as content } from "@/data/homepage";
import FeatureSection from "./FeatureSection";

/** Section 5: "Mutiara by Mocean, Our Beachfront Restaurant". */
export default function RestaurantSection() {
  return (
    <FeatureSection
      variant="restaurant"
      sub={content.sub}
      title={content.title}
      paragraphs={content.paragraphs}
      button={content.button}
      image={content.image}
    />
  );
}
