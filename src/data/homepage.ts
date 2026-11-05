/**
 * Homepage content, copied word for word from https://moceanbeachresort.com/
 * (Elementor page 8027). Edit text here; layout lives in src/components/home/.
 */

const img = (path: string) => `/images/uploads/${path}`;

/** Hero slides in the original order. */
/** `mobileImage`: the middle of the photo for phones and small tablets (scripts/hero-mobile-crops.ts). */
const heroSlide = (file: string) => ({ image: img(`2025/06/${file}`), mobileImage: `/images/hero-mobile/${file}` });

export const heroSlides = [
  heroSlide("Slider-mocean-1.jpg"),
  heroSlide("Slider-mocean-4.jpg"),
  heroSlide("Slider-mocean-5.jpg"),
  heroSlide("Slider-mocean-3.jpg"),
  heroSlide("Slider-mocean-2.jpg"),
  heroSlide("Slider-mocean-6.jpg"),
];

export const resortIntro = {
  sub: "Mocean Beach Resort",
  title: "A Beachfront Dive and Surf Resort in West Sumbawa",
  paragraphs: [
    "West Sumbawa’s only beachfront dive and surf resort, for those who want a touch of comfort with their adventure. Mocean Beach Resort sits on a quiet 2-kilometre stretch of Pantai Moro in West Sumbawa, Indonesia. Dive our house reef, surf uncrowded waves at Northern Rights right in front of the resort, tour the local coconut plantations and seaweed farms, or just walk the beach.",
  ],
  strongParagraph:
    "We have six bungalows and four Standard Rooms, so it never feels busy. Message us with your dates and we’ll tell you what’s free.",
  button: { label: "Check Dates on WhatsApp", href: "https://wa.me/6282144191647", newTab: true },
  mainImage: { src: img("2025/05/resort_galery_11.jpg"), width: 1650, height: 1100 },
  smallImage: { src: img("2025/06/resort_area.jpg"), width: 850, height: 750 },
};

export const accommodation = {
  sub: "Mocean",
  title: "Bungalows and Rooms by the Beach",
  text: [
    "Cradled by the shoreline of Pantai Moro, this beachfront retreat invites you to slow down and settle in. Open-air lounges drift with sea breeze, a jungle shower hides beneath the canopy, and a palm-lined pool invites you to float a little longer. Accommodations include six handcrafted bungalows, built with regional materials and softened by clean lines, alongside four garden-view Standard Rooms designed for comfort and ease. Together they create a natural balance of character and simplicity, each offering its own restful retreat. ",
    "Beyond these peaceful corners, days unfold in rhythm, diving into vibrant reefs, chasing waves, trekking to Agal Waterfall, or wandering ricefields touched by morning light. Every element is shaped with care, from the hush of nature to the stillness that welcomes you at dusk.",
  ],
  button: { label: "See the Rooms", href: "/accommodation/" },
  image: { src: img("2025/06/resort_area.jpg"), width: 850, height: 750 },
};

export const diving = {
  sub: "Mocean",
  title: "Diving at Mocean, Built by Divers",
  paragraphs: [
    "Designed by divers for divers, we offer a personalized dive experience. Our custom built boat offers ample room for guests and gear. The gear room is designed with individual storage lockers for dive equipment while the camera room offers individual work space for each underwater photographer. We offer equipment rental and PADI dive instruction with a purpose built pool for dive instruction.",
    "Two-tank boat dives start at IDR 2,200,000, with no more than four divers per guide.",
  ],
  button: { label: "See Dive Prices", href: "/pricing/" },
  image: { src: img("2025/06/The_diving_5.jpg"), width: 1700, height: 1486 },
};

export const restaurant = {
  sub: "Mutiara by Mocean",
  title: "Mutiara by Mocean, Our Beachfront Restaurant",
  paragraphs: [
    "Enjoy bold grilled favorites and fresh dishes with flavors inspired by the Asia-Pacific region. Dine in our open-air setting with stunning views of Moro Beach, ideal for a peaceful breakfast or a beautiful sunset dinner. Make special moments even better with private beachfront dining, where the sound of the waves adds something truly special to your evening.",
  ],
  button: { label: "See the Menu", href: "/restaurant/" },
  image: { src: img("2025/05/Dine_2.jpg"), width: 1700, height: 1486 },
};

export const activities = {
  sub: "The Mocean Life",
  title: "Surf, Waterfalls and Island Tours",
  text: "In addition to diving, Mocean Resort invites you to explore Sumbawa’s wonders. Surf epic waves, trek waterfalls, paraglide, and dive into rich culture. Balance adrenaline and serenity in breathtaking landscapes. Let us craft your perfect adventure.",
  boxes: [
    {
      title: "Surf",
      image: img("2025/06/Surfing-new.jpg"),
      text: "Mocean Dive Resort is also a surfer’s paradise, offering access to world-class waves and a peaceful, uncrowded surf experience for all skill levels.",
      hasDescription: true,
    },
    {
      title: "Nature",
      image: img("2025/06/Nature-new.jpg"),
      text: "Discover Sumbawa’s hidden gems with guided tours to waterfalls, local villages, and scenic lakes—an unforgettable island adventure awaits.",
      hasDescription: true,
    },
    {
      title: "Activities",
      image: img("2025/07/activities.jpg"),
      text: "Hike remote trails, paddle across Sumbawa’s crystal-clear waters, and engage with local traditions on a journey tailored for nature and adventure enthusiasts",
      hasDescription: false,
    },
  ],
};

export const testimonials = {
  sub: "Testimonial",
  title: "What Our Guests Say",
  background: img("2025/06/Banner-Homepage.jpg"),
  items: [
    {
      text: "Came in as a day guest for diving.\nEverything was very well organized, like new rental equipment, a nice boat for the trip and super friendly staff.\nFood and coffee at their restaurant after the dive was also very high quality.\nHighly recommend if you're in the area",
      author: "Stefan ",
      source: "Google Review",
      avatar: img("2025/06/review-img.jpg"),
    },
    {
      text: "Absolutely amazing. Felt immediately like home.\nLovely specious rooms with eye for detail. A big pool area right on the beach with one of the most consistent surf breaks right in front of the hotel. Food is great. Matt, the owner, is on top of things.",
      author: "Steven Redant ",
      source: "Google Review",
      avatar: img("2025/06/review-img.jpg"),
    },
  ],
};

export const facilities = {
  sub: "Mocean",
  title: "Resort Facilities",
  text: "Six handcrafted bungalows and four Standard Rooms, a palm-lined pool on the beach, and a restaurant that’s open from breakfast to dinner.",
  /** Four rows of two items; `gap` is the original spacing between the two items. */
  rows: [
    { gap: 82, items: [{ icon: "swimming-pool", label: "Outdoor swimming pool" }, { icon: "beach-access", label: "Private beach access" }] },
    { gap: 125, items: [{ icon: "diving", label: "Diving adventures" }, { icon: "restaurant", label: "On-site restaurant" }] },
    { gap: 23, items: [{ icon: "tea-coffee", label: "In-room tea and coffee makers" }, { icon: "breakfast", label: "Complimentary daily breakfast" }] },
    { gap: 87, items: [{ icon: "airport-shuttle", label: "Airport shuttle services" }, { icon: "wifi", label: "Free Wi-Fi" }] },
  ],
  button: { label: "See the Rooms", href: "/accommodation/" },
  topImage: { src: img("2025/05/resort_galery_2.jpg"), width: 1650, height: 1100 },
  bottomImage: { src: img("2025/05/resort_galery_6.jpg"), width: 1650, height: 1100 },
};

export const roomRates = {
  sub: "Mocean",
  title: "Rooms and Rates",
  text: "Surround yourself with authentic island charm in our artisan-built rooms, featuring local woodwork, high thatched ceilings, elegant furnishings, and calming natural tones all thoughtfully designed to offer a restful and immersive tropical retreat.",
  rooms: [
    {
      name: "Deluxe Bungalow with King Bed",
      size: "50 square meters with lanai",
      guests: "2 Guest",
      image: img("2025/09/accommodation_galery_12.jpg"),
      overlayOpacity: 0.32,
      prices: ["High Season Price: 2,800,000 IDR", "Shoulder Season Price: 2,337,500 IDR", "Low Season Price: 2,200,000 IDR"],
    },
    {
      name: "Deluxe Bungalow with Twin Beds",
      size: "50 square meters with lanai",
      guests: "2 Guest",
      image: img("2025/09/accommodation_galery_5.jpg"),
      overlayOpacity: 0.35,
      prices: ["High Season Price: 2,800,000 IDR", "Shoulder Season Price: 2,337,500 IDR", "Low Season Price: 2,200,000 IDR"],
    },
    {
      name: "Standard Room with King Bed",
      size: "39 square meters without lanai",
      guests: "3 Guest",
      image: img("2025/10/Standard-room-King-Bed.jpg"),
      overlayOpacity: 0.32,
      prices: ["High Season Price: 2,150,000 IDR", "Shoulder Season Price: 1,785,000 IDR", "Low Season Price: 1,690,000 IDR"],
    },
    {
      name: "Standard Room with Twin Bed",
      size: "39 square meters without lanai",
      guests: "3 Guest",
      image: img("2025/09/Standard-room.jpg"),
      overlayOpacity: 0.32,
      prices: ["High Season Price: 2,150,000 IDR", "Shoulder Season Price: 1,785,000 IDR", "Low Season Price: 1,690,000 IDR"],
    },
  ],
  note: "All rates cover two guests, breakfast, tax and service. Book three nights or more directly with us and we’ll take a discount off.",
  button: { label: "Check Availability on WhatsApp", href: "https://wa.me/6282144191647", newTab: true },
};

export const faq = {
  sub: "FAQ",
  title: "Mocean Beach Resort FAQ",
  image: { src: img("2025/09/beach-resort-under-2.jpg"), width: 1650, height: 825 },
  items: [
    {
      question: "Where is Mocean Beach Resort?",
      answer:
        "On Pantai Moro (Moro Beach) in West Sumbawa, Indonesia. It’s about 30 minutes by car from Poto Tano ferry port and around 2 hours 15 minutes from Sumbawa Besar airport (SWQ). We arrange pickups from both.",
    },
    {
      question: "Is Mocean a dive resort or a surf resort?",
      answer:
        "Both. We run a full dive center with a custom-built boat, gear lockers, a camera room, a training pool and PADI courses. Northern Rights breaks right in front of the resort, with Middle Reef and Dirty Hippies a short walk down the beach.",
    },
    {
      question: "How much does a room cost?",
      answer:
        "Standard Rooms are IDR 1,690,000 to 2,100,000 a night and Deluxe Garden View Bungalows are IDR 2,200,000 to 2,750,000, depending on season. Rates cover two guests, breakfast, tax and service. Stays of three nights or more booked direct get a discount.",
    },
    {
      question: "When is the best time to visit West Sumbawa?",
      answer:
        "May to October is dry season, with the most consistent surf and the clearest water. Our dive season runs 1 April to 31 October. November to April is greener and quieter, with lower room rates.",
    },
    {
      question: "Can I visit for the day without staying?",
      answer:
        "Yes. Day guests are welcome to dive with us, and a pool day pass costs IDR 300,000 (10:00 to 17:00), with IDR 200,000 of that usable in the restaurant.",
    },
    {
      question: "How do I book?",
      answer:
        "Message us on WhatsApp at +62 821 4419 1647 or email bookings@moceanbeachresort.com with your dates. Booking direct gets you the multi-night discount and help with transfers.",
    },
  ],
};

export const bookingCta = {
  title: "Book Your Stay at Mocean",
  background: img("2025/06/Banner-Homepage.jpg"),
  text: "Tell us when you want to come and whether you’re here to dive, surf or slow down. We’ll reply with free rooms, the best rate for your dates and how to get here from Bali or Lombok. Most guests fly into Sumbawa Besar or take the ferry to Poto Tano, and we pick up from both.",
  buttons: [
    { label: "Check Dates on WhatsApp", href: "https://wa.me/6282144191647", newTab: true },
    { label: "See Room Prices", href: "/pricing/" },
  ],
};
