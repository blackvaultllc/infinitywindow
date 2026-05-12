import sitter1 from "@/assets/sitter-1.jpg";
import sitter2 from "@/assets/sitter-2.jpg";
import sitter3 from "@/assets/sitter-3.jpg";

export type Sitter = {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  rate: number;
  image: string;
  tags: string[];
  bio: string;
  repeatClients: number;
  yearsExperience: number;
};

export const sitters: Sitter[] = [
  {
    id: "maya-r",
    name: "Maya R.",
    city: "Brooklyn, NY",
    rating: 4.98,
    reviews: 214,
    rate: 48,
    image: sitter1,
    tags: ["Boarding", "Small dogs", "Puppies"],
    bio: "Lifelong dog lover with a fenced yard and endless cuddles. Daily photo updates guaranteed.",
    repeatClients: 41,
    yearsExperience: 6,
  },
  {
    id: "diego-m",
    name: "Diego M.",
    city: "Austin, TX",
    rating: 4.95,
    reviews: 178,
    rate: 42,
    image: sitter2,
    tags: ["Walks", "Large breeds", "Active dogs"],
    bio: "Marathon runner — your high-energy pup will get the long trail days they dream about.",
    repeatClients: 33,
    yearsExperience: 4,
  },
  {
    id: "linda-h",
    name: "Linda H.",
    city: "Portland, OR",
    rating: 5.0,
    reviews: 309,
    rate: 55,
    image: sitter3,
    tags: ["Senior dogs", "Medication", "Quiet home"],
    bio: "Retired veterinary nurse offering a calm, gentle stay for older pups and special needs.",
    repeatClients: 78,
    yearsExperience: 12,
  },
  {
    id: "maya-r2",
    name: "Sarah K.",
    city: "Brooklyn, NY",
    rating: 4.92,
    reviews: 96,
    rate: 38,
    image: sitter1,
    tags: ["Daycare", "Drop-in visits"],
    bio: "Work-from-home sitter with a sunny apartment two blocks from Prospect Park.",
    repeatClients: 22,
    yearsExperience: 3,
  },
  {
    id: "diego-m2",
    name: "Marcus T.",
    city: "Austin, TX",
    rating: 4.89,
    reviews: 142,
    rate: 45,
    image: sitter2,
    tags: ["House sitting", "Multiple dogs"],
    bio: "Comfortable handling packs of up to four. Trained in basic obedience and recall.",
    repeatClients: 27,
    yearsExperience: 5,
  },
  {
    id: "linda-h2",
    name: "Priya S.",
    city: "Portland, OR",
    rating: 4.97,
    reviews: 188,
    rate: 50,
    image: sitter3,
    tags: ["Boarding", "Cat-friendly", "Long stays"],
    bio: "Cozy craftsman home with a big backyard, two senior dogs, and a friendly tabby.",
    repeatClients: 54,
    yearsExperience: 8,
  },
];
