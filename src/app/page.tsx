import Accommodation from "@/components/home/Accommodation";
import Activities from "@/components/home/Activities";
import BookingCTA from "@/components/home/BookingCTA";
import DivingSection from "@/components/home/DivingSection";
import Facilities from "@/components/home/Facilities";
import FAQ from "@/components/home/FAQ";
import HeroSlider from "@/components/home/HeroSlider";
import ResortIntro from "@/components/home/ResortIntro";
import RestaurantSection from "@/components/home/RestaurantSection";
import RoomRates from "@/components/home/RoomRates";
import Testimonials from "@/components/home/Testimonials";
import JsonLd from "@/components/shared/JsonLd";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("/");

/** Homepage — sections in the same order as the original. */
export default function HomePage() {
  return (
    <>
      <JsonLd path="/" />
      <HeroSlider />
      <ResortIntro />
      <Accommodation />
      <DivingSection />
      <RestaurantSection />
      <Activities />
      <Testimonials />
      <Facilities />
      <RoomRates />
      <FAQ />
      <BookingCTA />
    </>
  );
}
