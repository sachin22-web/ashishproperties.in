export interface RohtakLocationData {
  city: string;
  categories: {
    colonies_nagars: string[];
    chowks_landmarks: string[];
    sectors: string[];
    other_popular_localities: string[];
  };
}

export const rohtakLocations: RohtakLocationData = {
  city: "Rohtak",
  categories: {
    colonies_nagars: [
      "Adarsh Nagar",
      "Ambedkar Colony",
      "Amrit Colony",
      "Anand Nagar",
      "Arya Nagar",
      "Babat Mohalla",
      "Bhagat Singh Colony",
      "Bharat Colony",
      "Beniwal Nagar",
      "Chandi Ram Colony",
      "Chawla Colony",
      "Chhotu Ram Nagar",
      "Chunnipura",
      "DLF Colony",
      "Dairy Mohalla",
      "Durga Colony",
      "Devi Vihar",
      "Dhariyao Singh Nagar",
      "Ekta Colony",
      "Gandhi Nagar",
      "Geeta Colony",
      "Gopal Pura",
      "Hari Singh Colony",
      "Jagdish Colony",
      "Janta Colony",
      "Jawahar Nagar",
      "Kamla Nagar",
      "Kailash Colony",
      "Kath Mandi",
      "Kewal Gunj",
      "Kirpal Nagar",
      "Lal Bhadur Shastry Nagar",
      "Laxmi Nagar",
      "Mansarover Colony",
      "Mini Secretariate",
      "Model Town",
      "Nehru Colony",
      "New Janta Colony",
      "Nirmal Nagar",
      "Neta Ji Colony",
      "Old Power House Colony",
      "Old Housing Board Colony",
      "Palika Colony",
      "Patel Nagar",
      "Police Line Colony",
      "Prem Nagar",
      "Pratap Nagar",
      "Rajendra Colony",
      "Rajeev Colony",
      "Ram Gopal Colony",
      "Ram Nagar",
      "Revenue Colony",
      "Roop Vihar",
      "Sain Dass Colony",
      "Sanik Colony",
      "Sanjay Colony",
      "Sant Nagar",
      "Srinagar Colony",
      "Sham Colony",
      "Shastri Nagar",
      "Shiv Nagar",
      "Shivam Enclave",
      "Subhash Nagar",
      "Suncity Township 1",
      "Sukhpura",
      "Uttam Vihar",
      "Vijay Nagar",
      "Vikas Nagar",
      "Vinay Nagar",
      "Vaish Colony",
      "Yuva Kendra Colony",
    ],
    chowks_landmarks: [
      "Chawla Chowk",
      "Chhotu Ram Chowk",
      "Prem Nagar Chowk",
      "Mata Mandir Chowk",
      "Sunaria Chowk",
      "Sukhpura Chowk",
    ],
    sectors: [
      "Sector-1",
      "Sector-2",
      "Sector-3",
      "Sector-4",
      "Sector-5",
      "Sector-6",
      "Sector-7",
      "Sector-14",
      "Sector-21",
      "Sector-22",
      "Sector-24",
      "Sector-25",
      "Sector-26",
      "Sector-27",
      "Sector-28",
      "Sector-29",
      "Sector-30 (Commercial)",
      "Sector-31",
      "Sector-33",
      "Sector-33A",
      "Sector-36A",
      "Sector-37",
    ],
    other_popular_localities: [
      "Bara Bazar",
      "Gohana Road (commercial stretch)",
      "Railway Colony",
      "New Grain Market",
      "H.U.D.A. Complex",
      "Sugar Mill Colony",
      "Industrial Model Township",
      "HSIIDC Industrial Area",
    ],
  },
};

// Helper functions to get location data
export const getAllRohtakLocations = (): string[] => {
  const {
    colonies_nagars,
    chowks_landmarks,
    sectors,
    other_popular_localities,
  } = rohtakLocations.categories;
  return [
    ...colonies_nagars,
    ...chowks_landmarks,
    ...sectors,
    ...other_popular_localities,
  ];
};

export const getRohtakSectors = (): string[] => {
  return rohtakLocations.categories.sectors;
};

export const getRohtakColonies = (): string[] => {
  return rohtakLocations.categories.colonies_nagars;
};

export const getRohtakLandmarks = (): string[] => {
  return [
    ...rohtakLocations.categories.chowks_landmarks,
    ...rohtakLocations.categories.other_popular_localities,
  ];
};
