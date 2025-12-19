// data/plantData.js
// NOTE: videoUrl uses the uploaded local file path you provided.
// It will be served/translated by your environment as needed.
const VIDEO_PATH = "\public\assets\AYUR-VANA _ A Virtual Herbal Garden by ETHERJACK.mp4";

const plants = [
  {
    id: "Ahwagandha",
    displayName: "Ashwagandha",
    modelPath: "/models/Ahwagandha.glb",
    short: "Adaptogenic herb used to reduce stress and fatigue.",
    description:
      "Scientific Name: Withania somnifera\n" +
      "Plant Type: Medicinal shrub\n" +
      "Key Feature: Adaptogenic roots\n" +
      "Size: 35–75 cm tall\n" +
      "Care Needs: Dry soil, full sunlight\n\n" +
      "Ashwagandha is mainly used to reduce stress, improve strength, and support overall vitality. It is widely used in Ayurvedic immunity and wellness formulations.",
   // videoUrl: "https://www.youtube.com/embed/9rPZQ0jXH2A",
    image: "/images/ashwa.jpg"
  },
  {
    id: "Aloe vera plant",
    displayName: "Aloe Vera",
    // matches your file name with spaces
    modelPath: "/models/Aloe vera plant.glb",
    short: "Soothing succulent used for skin care and digestion.",
    description:
      "Scientific Name: Aloe barbadensis miller\n" +
      "Plant Type: Succulent medicinal plant\n" +
      "Key Feature: Gel-filled fleshy leaves\n" +
      "Size: 60–100 cm\n" +
      "Care Needs: Minimal watering, indirect sunlight\n\n" +
      "Aloe vera is used for skin healing, burns, and digestion. The gel has cooling, soothing, and anti-inflammatory properties.",
   // videoUrl: "https://www.youtube.com/embed/Q3hE1dU8VnY",
    image: "/images/alovera.jpg"
  },
  {
    id: "Astragalus sinicus",
    displayName: "Astragalus",
    modelPath: "/models/Astragalus sinicus.glb",
    short: "Supportive herb for immune function and endurance.",
description:
      "Scientific Name: Astragalus sinicus\n" +
      "Plant Type: Perennial herb\n" +
      "Key Feature: Immune-boosting roots\n" +
      "Size: 30–50 cm\n" +
      "Care Needs: Well-drained soil, moderate sunlight\n\n" +
      "Astragalus is used to strengthen immunity and increase stamina. It is commonly used as a tonic in traditional medicine.",
   // videoUrl: "https://www.youtube.com/embed/4V4d0b8kQeE",
    image: "/images/astra.jpg"
  },
  {
    id: "basil",
    displayName: "Basil",
    modelPath: "/models/basil.glb",
    short: "Culinary and medicinal herb; anti-inflammatory.",
description:
      "Scientific Name: Ocimum basilicum\n" +
      "Plant Type: Aromatic herb\n" +
      "Key Feature: Fragrant leaves\n" +
      "Size: 30–60 cm\n" +
      "Care Needs: Regular watering, sunlight\n\n" +
      "Basil is used for digestion, respiratory relief, and inflammation control. It is also widely used in cooking and herbal remedies.",
   // videoUrl: "https://www.youtube.com/embed/1EwZ5k3m8nE",
    image: "/images/basil.jpg"
  },
  {
    id: "Belladonna",
    displayName: "Belladonna",
    modelPath: "/models/Belladonna.glb",
    short: "Poisonous medicinal plant used historically in small doses.",
 description:
      "Scientific Name: Atropa belladonna\n" +
      "Plant Type: Perennial herbaceous plant\n" +
      "Key Feature: Alkaloid-rich leaves and berries\n" +
      "Size: 1–1.5 m\n" +
      "Care Needs: Moist soil, partial shade\n\n" +
      "Belladonna is used in controlled medical doses for pain and muscle spasms. Improper use can be highly poisonous.",
    //videoUrl: "https://www.youtube.com/embed/3m6K7kKZ7uU",
    image: "/images/bella.jpg"
  },
  {
    id: "Cardamom",
    displayName: "Cardamom",
    modelPath: "/models/Cardamom.glb",
    short: "Aromatic spice used for digestion and flavor.",
   description:
      "Scientific Name: Elettaria cardamomum\n" +
      "Plant Type: Perennial herb\n" +
      "Key Feature: Aromatic seed pods\n" +
      "Size: 2–4 m\n" +
      "Care Needs: Humid climate, shade\n\n" +
      "Cardamom is used to aid digestion and improve appetite. It is also valued for its flavor and medicinal aroma.",
    //videoUrl: "https://www.youtube.com/embed/J0t7H0Nqv0M",
    image: "/images/car.jpg"
  },
  {
    id: "Chestnut",
    displayName: "Chestnut",
    modelPath: "/models/Chestnut.glb",
    short: "Nut-bearing tree; some species have medicinal uses.",
 description:
      "Scientific Name: Castanea species\n" +
      "Plant Type: Deciduous tree\n" +
      "Key Feature: Edible nuts\n" +
      "Size: 20–30 m\n" +
      "Care Needs: Deep soil, open sunlight\n\n" +
      "Chestnut is used for nutritional benefits and traditional remedies. Some species support circulation and skin health.",
    //videoUrl: "https://www.youtube.com/embed/9n5cWJ0NQe8",
    image: "/images/chestu.jpg"
  },
  {
    id: "Cinnamon",
    displayName: "Cinnamon",
    modelPath: "/models/Cinnamon.glb",
    short: "Warm spice used for blood sugar support and flavor.",
  description:
      "Scientific Name: Cinnamomum verum\n" +
      "Plant Type: Evergreen tree\n" +
      "Key Feature: Aromatic bark\n" +
      "Size: 10–15 m\n" +
      "Care Needs: Warm climate, moist soil\n\n" +
      "Cinnamon is used to regulate blood sugar and improve digestion. It also has antimicrobial properties.",
    //videoUrl: "https://www.youtube.com/embed/8E9F9Z2JpZQ",
    image: "/images/chinna.jpg"
  },
  {
    id: "clove",
    displayName: "Clove",
    modelPath: "/models/clove.glb",
    short: "Strong aromatic spice used for toothache and antiseptic properties.",
    description:
      "Scientific Name: Syzygium aromaticum\n" +
      "Plant Type: Evergreen tree\n" +
      "Key Feature: Dried flower buds\n" +
      "Size: 8–12 m\n" +
      "Care Needs: Tropical climate, rainfall\n\n" +
      "Clove is used for toothache relief and as an antiseptic. It is also used in digestive and respiratory remedies.",
    //videoUrl: "https://www.youtube.com/embed/5z4YkqvK0VY",
    image: "/images/clove.jpg"
  },
  {
    id: "Foxglove",
    displayName: "Foxglove",
    modelPath: "/models/Foxglove.glb",
    short: "Source of cardiac glycosides (medicinal but toxic).",
 description:
      "Scientific Name: Digitalis purpurea\n" +
      "Plant Type: Biennial plant\n" +
      "Key Feature: Cardiac glycosides\n" +
      "Size: 1–2 m\n" +
      "Care Needs: Cool climate, moist soil\n\n" +
      "Foxglove is used in heart medication under medical supervision. The plant itself is toxic if misused.",
    //videoUrl:"https://www.youtube.com/embed/R0pF5L9FqTg",
    image: "/images/fox.jpg"
  },
  {
    id: "Neem",
    displayName: "Neem",
    modelPath: "/models/Neem.glb",
    short: "Bitter herb used for skin, oral, and immune health.",
description:
  "Scientific Name: Azadirachta indica\n" +
  "Plant Type: Evergreen medicinal tree\n" +
  "Key Feature: Bitter leaves with antibacterial properties\n" +
  "Size: 15–20 m\n" +
  "Care Needs: Minimal watering, full sunlight\n\n" +
  "Neem is used for skin care, oral hygiene, and immune support. It has strong antibacterial and antifungal properties in traditional medicine.",
    //videoUrl: "https://www.youtube.com/embed/F6t4b4z0ZzA",
    image: "/images/neem.jpg"
  },
  {
    id: "snakeplant",
    displayName: "Snake Plant",
    modelPath: "/models/snakeplant.glb",
    short: "Air-purifying ornamental plant.",
description:
      "Scientific Name: Sansevieria trifasciata\n" +
      "Plant Type: Succulent houseplant\n" +
      "Key Feature: Upright sword-like leaves\n" +
      "Size: 30–90 cm\n" +
      "Care Needs: Low water, indirect light\n\n" +
      "Snake plant improves indoor air quality and is easy to maintain. It is mainly used for decorative and environmental benefits.",
    //videoUrl: "https://www.youtube.com/embed/1A3pK5ZxZ6g",
    image: "/images/snake.jpg"
  },
  {
    id: "tulsi",
    displayName: "Tulsi (Holy Basil)",
    modelPath: "/models/tulsi.glb",
    short: "Highly revered Ayurvedic herb for immunity and respiratory health.",
description:
  "Scientific Name: Ocimum sanctum\n" +
  "Plant Type: Aromatic medicinal herb\n" +
  "Key Feature: Strong medicinal fragrance and essential oils\n" +
  "Size: 30–60 cm\n" +
  "Care Needs: Regular watering, full sunlight\n\n" +
  "Tulsi is widely used in Ayurveda to improve immunity and respiratory health. It is commonly consumed as herbal tea and used in traditional remedies.",
    //videoUrl: "https://www.youtube.com/embed/1EwZ5k3m8nE",
    image: "/images/tulsi.jpg"
  },
  {
    id: "Turmeric",
    displayName: "Turmeric",
    modelPath: "/models/Turmeric.glb",
    short: "Anti-inflammatory root used for digestion and joint support.",
description:
  "Scientific Name: Curcuma longa\n" +
  "Plant Type: Perennial medicinal herb\n" +
  "Key Feature: Bright yellow underground rhizome\n" +
  "Size: 60–90 cm\n" +
  "Care Needs: Warm climate, moist well-drained soil\n\n" +
  "Turmeric is used for its anti-inflammatory and antioxidant benefits. It is widely used in cooking and traditional remedies for joint and digestive health.",
    //videoUrl: "https://www.youtube.com/embed/8E9F9Z2JpZQ",
    image: "/images/turmeric.jpg"
  }
];

export default plants;
