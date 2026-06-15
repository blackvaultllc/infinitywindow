// Curated historical witnesses shown above community stories.
// These are well-documented public-record events — not user submissions.
// Goal: anchor the page with real history so visitors feel the weight before
// they read or write a new story.

export type SeedStory = {
  id: string;
  title: string;
  category: "experience" | "family_history" | "injustice" | "heritage" | "other";
  attribution: string;
  year: string;
  body: string;
};

export const SEED_STORIES: SeedStory[] = [
  {
    id: "seed-galveston-1865",
    title: "Galveston, Texas — June 19, 1865",
    category: "heritage",
    attribution: "Historical record · General Order No. 3",
    year: "1865",
    body:
      "Two and a half years after the Emancipation Proclamation, Union Major General Gordon Granger rode into Galveston, Texas, and read General Order No. 3 aloud: 'The people of Texas are informed that, in accordance with a proclamation from the Executive of the United States, all slaves are free.' For a quarter of a million Black people in Texas, freedom had been delayed by years — not by misunderstanding, but by the refusal of slaveholders to give it up. Juneteenth honors that delayed dawn, and the truth that freedom delayed is freedom denied.",
  },
  {
    id: "seed-tulsa-1921",
    title: "Tulsa, Oklahoma — Greenwood was burning",
    category: "injustice",
    attribution: "Historical record · 1921 Tulsa Race Massacre",
    year: "1921",
    body:
      "Greenwood was called Black Wall Street — a thriving district of Black-owned banks, hotels, theaters, doctors, lawyers, grocers, and homes. On May 31 and June 1, 1921, a white mob, deputized by city officials and joined by the National Guard, burned 35 city blocks to the ground. As many as 300 Black residents were killed. Ten thousand were left homeless. No insurance was paid. No one was prosecuted. The story was buried for decades — left out of school books, left out of newspapers — until survivors and their descendants forced it back into the light.",
  },
  {
    id: "seed-emmett-till-1955",
    title: "Money, Mississippi — Emmett Till was 14",
    category: "injustice",
    attribution: "Historical record · 1955",
    year: "1955",
    body:
      "Emmett Till was 14 years old, visiting family from Chicago, when he was accused of whistling at a white woman in a grocery store. Days later he was kidnapped, tortured, shot, and thrown into the Tallahatchie River with a cotton-gin fan tied to his neck with barbed wire. His mother, Mamie Till-Mobley, insisted on an open casket so the world could see what was done to her son. Her courage helped ignite the civil rights movement. Decades later, the woman who accused him admitted, in part, that she had lied.",
  },
  {
    id: "seed-bloody-sunday-1965",
    title: "Selma, Alabama — Bloody Sunday on the Edmund Pettus Bridge",
    category: "injustice",
    attribution: "Historical record · March 7, 1965",
    year: "1965",
    body:
      "Six hundred peaceful marchers, led by John Lewis and Hosea Williams, walked across the Edmund Pettus Bridge demanding the right to vote. State troopers met them with billy clubs and tear gas. John Lewis's skull was fractured. The footage went out across television sets in living rooms nationwide, and a country that had looked away could not look away anymore. Five months later, the Voting Rights Act became law. The bridge — still named for a Confederate general and Klansman — still stands.",
  },
  {
    id: "seed-diallo-1999",
    title: "Bronx, New York — Amadou Diallo, 41 shots",
    category: "injustice",
    attribution: "Historical record · February 4, 1999",
    year: "1999",
    body:
      "Amadou Diallo, a 23-year-old immigrant from Guinea, was standing in the vestibule of his own Bronx apartment building when four plainclothes NYPD officers approached. He reached for his wallet. They fired 41 shots; 19 hit him. He was unarmed. All four officers were acquitted of every charge. His name became one of the first of the modern era to be chanted in the streets — a list that did not stop growing.",
  },
  {
    id: "seed-jena-2006",
    title: "Jena, Louisiana — Nooses on the schoolyard tree",
    category: "injustice",
    attribution: "Historical record · 2006",
    year: "2006",
    body:
      "Three white students at Jena High School hung nooses from a tree where Black students had asked to sit. The school called it a prank and gave the boys a three-day suspension. Months of escalating racial violence followed. When six Black teenagers — the Jena Six — were involved in a schoolyard fight with a white student, the local DA charged them with attempted second-degree murder. Tens of thousands marched on the small Louisiana town demanding the charges be reduced. The case made plain to a generation that the criminal-justice scales are weighed differently depending on which side of the tree you sit on.",
  },
  {
    id: "seed-katrina-2005",
    title: "New Orleans, Louisiana — Left on the rooftops",
    category: "injustice",
    attribution: "Historical record · Hurricane Katrina, August 2005",
    year: "2005",
    body:
      "When the levees broke, the people left in the water were overwhelmingly Black. Families waved sheets from rooftops for days. News outlets called white survivors carrying food 'finding'; they called Black survivors carrying food 'looting.' On the Danziger Bridge, NOPD officers opened fire on unarmed Black residents fleeing the flood, killing two and wounding four. It took years for those officers to be convicted, and even then sentences were reduced. Katrina was a natural disaster. What happened after was not.",
  },
  {
    id: "seed-sean-bell-2006",
    title: "Queens, New York — Sean Bell on his wedding day",
    category: "injustice",
    attribution: "Historical record · November 25, 2006",
    year: "2006",
    body:
      "Sean Bell was leaving his bachelor party the morning he was supposed to be married. Undercover NYPD officers fired 50 rounds into his car. He was unarmed. He died at 23. His daughters grew up without him. All three officers indicted were acquitted. His fiancée wore her wedding dress to his funeral.",
  },
  {
    id: "seed-trayvon-2012",
    title: "Sanford, Florida — Trayvon was walking home",
    category: "injustice",
    attribution: "Historical record · February 26, 2012",
    year: "2012",
    body:
      "Trayvon Martin was 17, walking back from a convenience store with a bag of Skittles and an iced tea. A neighborhood watchman followed him in his truck, got out, and shot him. Police initially released the shooter without charges. The acquittal that came a year later gave rise to three words written by Alicia Garza on Facebook that would name a movement: Black Lives Matter.",
  },
  {
    id: "seed-floyd-2020",
    title: "Minneapolis, Minnesota — Nine minutes, twenty-nine seconds",
    category: "injustice",
    attribution: "Historical record · May 25, 2020",
    year: "2020",
    body:
      "George Floyd called for his mother. A Minneapolis police officer knelt on his neck for nine minutes and twenty-nine seconds while three other officers stood by. A 17-year-old named Darnella Frazier kept her phone steady and filmed. The video moved the world. That summer, the largest protest movement in U.S. history filled the streets of every state and dozens of countries. We were saying what our grandparents had been saying. We were tired of saying it.",
  },
];
