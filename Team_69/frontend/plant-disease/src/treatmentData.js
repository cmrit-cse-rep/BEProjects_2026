// Treatment Plans Database
// Maps disease names to comprehensive treatment information

export const treatmentDatabase = {
    // ==================== POTATO DISEASES ====================

    "Early Blight": {
        diseaseName: "Early Blight (Potato)",
        severity: "Medium to High",
        description: "Fungal disease caused by Alternaria solani, characterized by dark brown spots with concentric rings on leaves.",

        symptoms: [
            "Dark brown spots with concentric rings (target-like pattern) on older leaves",
            "Yellowing around the spots",
            "Leaf drop and defoliation",
            "Reduced tuber size and yield"
        ],

        organicTreatment: {
            title: "Organic Treatment Options",
            steps: [
                "Remove and destroy infected leaves immediately",
                "Apply neem oil spray (2-3 tablespoons per gallon of water) weekly",
                "Use copper-based fungicides (Bordeaux mixture)",
                "Apply compost tea as a foliar spray to boost plant immunity",
                "Ensure proper spacing for air circulation"
            ],
            products: [
                {
                    name: "Neem Oil Concentrate",
                    description: "100% pure cold-pressed neem oil for organic disease control",
                    link: "https://www.amazon.in/s?k=neem+oil+for+plants",
                    price: "₹200-400"
                },
                {
                    name: "Organic Copper Fungicide",
                    description: "Bonide Copper Fungicide for early blight control",
                    link: "https://www.amazon.in/s?k=copper+fungicide",
                    price: "₹300-500"
                }
            ]
        },

        chemicalTreatment: {
            title: "Chemical Treatment Options",
            steps: [
                "Apply chlorothalonil-based fungicides at first sign of disease",
                "Use mancozeb or azoxystrobin fungicides every 7-10 days",
                "Rotate fungicides to prevent resistance",
                "Follow label instructions for dosage and safety",
                "Spray early morning or late evening"
            ],
            products: [
                {
                    name: "Mancozeb 75% WP",
                    description: "Broad-spectrum fungicide for early blight",
                    link: "https://www.amazon.in/s?k=mancozeb+fungicide",
                    price: "₹150-300"
                },
                {
                    name: "Azoxystrobin 23% SC",
                    description: "Systemic fungicide for effective disease control",
                    link: "https://www.amazon.in/s?k=azoxystrobin+fungicide",
                    price: "₹400-600"
                }
            ]
        },

        prevention: [
            "Plant resistant varieties",
            "Rotate crops (avoid planting potatoes in same spot for 3 years)",
            "Remove plant debris after harvest",
            "Water at soil level, avoid wetting foliage",
            "Apply mulch to prevent soil splash onto leaves",
            "Maintain proper plant spacing (12-15 inches)"
        ]
    },

    "Late Blight": {
        diseaseName: "Late Blight (Potato)",
        severity: "Very High - Urgent Action Required",
        description: "Devastating fungal disease caused by Phytophthora infestans. Can destroy entire crop within days.",

        symptoms: [
            "Water-soaked spots on leaves that turn brown/black",
            "White fuzzy growth on leaf undersides (in humid conditions)",
            "Rapid spread during cool, wet weather",
            "Brown lesions on stems",
            "Tuber rot with reddish-brown discoloration"
        ],

        organicTreatment: {
            title: "Organic Treatment Options",
            steps: [
                "Remove and burn all infected plants immediately",
                "Apply copper-based fungicides preventively",
                "Use Bacillus subtilis biological fungicide",
                "Improve air circulation by pruning",
                "Avoid overhead watering completely"
            ],
            products: [
                {
                    name: "Copper Oxychloride 50% WP",
                    description: "Effective copper fungicide for late blight prevention",
                    link: "https://www.amazon.in/s?k=copper+oxychloride",
                    price: "₹200-350"
                },
                {
                    name: "Bacillus Subtilis Bio-Fungicide",
                    description: "Biological control agent for fungal diseases",
                    link: "https://www.amazon.in/s?k=bacillus+subtilis+fungicide",
                    price: "₹300-500"
                }
            ]
        },

        chemicalTreatment: {
            title: "Chemical Treatment Options",
            steps: [
                "Apply systemic fungicides (metalaxyl + mancozeb) immediately",
                "Use cymoxanil or dimethomorph for severe infections",
                "Spray every 5-7 days during disease-favorable weather",
                "Ensure complete coverage of all plant parts",
                "Continue treatment until 2 weeks before harvest"
            ],
            products: [
                {
                    name: "Metalaxyl 8% + Mancozeb 64% WP",
                    description: "Systemic and contact fungicide combination",
                    link: "https://www.amazon.in/s?k=metalaxyl+mancozeb",
                    price: "₹300-500"
                },
                {
                    name: "Cymoxanil 8% + Mancozeb 64%",
                    description: "Powerful combination for late blight control",
                    link: "https://www.amazon.in/s?k=cymoxanil+mancozeb",
                    price: "₹350-550"
                }
            ]
        },

        prevention: [
            "Plant certified disease-free seed potatoes",
            "Choose resistant varieties (e.g., Kufri Girdhari, Kufri Jyoti)",
            "Monitor weather - high risk when cool (10-25°C) and humid (>80%)",
            "Hill up soil around plants to protect tubers",
            "Harvest during dry weather",
            "Destroy all volunteer potato plants"
        ]
    },

    "Healthy": {
        diseaseName: "Healthy Potato Plant",
        severity: "None - Plant is Healthy",
        description: "Your potato plant appears healthy! Continue good agricultural practices to maintain plant health.",

        symptoms: [
            "Vibrant green foliage",
            "No spots or discoloration",
            "Strong stem structure",
            "Normal growth pattern"
        ],

        organicTreatment: {
            title: "Maintenance & Prevention",
            steps: [
                "Continue regular monitoring for early disease detection",
                "Apply compost or organic fertilizer monthly",
                "Maintain consistent watering schedule",
                "Use neem oil spray monthly as preventive measure",
                "Keep area weed-free"
            ],
            products: [
                {
                    name: "Organic NPK Fertilizer",
                    description: "Balanced nutrition for healthy potato growth",
                    link: "https://www.amazon.in/s?k=organic+npk+fertilizer",
                    price: "₹250-400"
                },
                {
                    name: "Vermicompost",
                    description: "Rich organic compost for soil health",
                    link: "https://www.amazon.in/s?k=vermicompost",
                    price: "₹150-300"
                }
            ]
        },

        chemicalTreatment: {
            title: "Preventive Care",
            steps: [
                "Apply balanced NPK fertilizer as per soil test",
                "Use preventive fungicide spray during monsoon",
                "Apply micronutrient spray for optimal growth",
                "Monitor for pest activity regularly"
            ],
            products: [
                {
                    name: "NPK 19:19:19 Fertilizer",
                    description: "Balanced fertilizer for vegetative growth",
                    link: "https://www.amazon.in/s?k=npk+19+19+19",
                    price: "₹200-350"
                }
            ]
        },

        prevention: [
            "Continue current good practices",
            "Monitor weather for disease-favorable conditions",
            "Inspect plants weekly for early problem detection",
            "Maintain soil health with organic matter",
            "Ensure proper drainage"
        ]
    },

    // ==================== TOMATO DISEASES ====================

    "Tomato__Bacterial_spot": {
        diseaseName: "Bacterial Spot (Tomato)",
        severity: "Medium to High",
        description: "Bacterial disease caused by Xanthomonas species, affecting leaves, stems, and fruit.",

        symptoms: [
            "Small, dark brown spots with yellow halos on leaves",
            "Raised spots on fruit",
            "Leaf yellowing and drop",
            "Reduced fruit quality and yield"
        ],

        organicTreatment: {
            title: "Organic Treatment Options",
            steps: [
                "Remove infected leaves and destroy them",
                "Apply copper-based bactericides",
                "Use biological control agents (Bacillus species)",
                "Avoid overhead irrigation",
                "Disinfect tools between plants"
            ],
            products: [
                {
                    name: "Copper Hydroxide Bactericide",
                    description: "Organic copper spray for bacterial diseases",
                    link: "https://www.amazon.in/s?k=copper+hydroxide",
                    price: "₹300-500"
                },
                {
                    name: "Bacillus Amyloliquefaciens",
                    description: "Biological bactericide for plant protection",
                    link: "https://www.amazon.in/s?k=bacillus+amyloliquefaciens",
                    price: "₹350-550"
                }
            ]
        },

        chemicalTreatment: {
            title: "Chemical Treatment Options",
            steps: [
                "Apply streptomycin sulfate at first sign of disease",
                "Use copper-based bactericides weekly",
                "Combine with mancozeb for better control",
                "Spray during cool, dry weather",
                "Follow pre-harvest intervals strictly"
            ],
            products: [
                {
                    name: "Streptomycin Sulfate 90% + Tetracycline 10%",
                    description: "Antibiotic for bacterial disease control",
                    link: "https://www.amazon.in/s?k=streptomycin+plant",
                    price: "₹400-600"
                },
                {
                    name: "Copper Oxychloride 50% WP",
                    description: "Preventive and curative bactericide",
                    link: "https://www.amazon.in/s?k=copper+oxychloride",
                    price: "₹200-350"
                }
            ]
        },

        prevention: [
            "Use disease-free certified seeds",
            "Practice crop rotation (3-year cycle)",
            "Avoid working with wet plants",
            "Use drip irrigation instead of sprinklers",
            "Space plants properly for air circulation",
            "Remove and destroy crop debris after harvest"
        ]
    },

    "Tomato__Early_blight": {
        diseaseName: "Early Blight (Tomato)",
        severity: "Medium",
        description: "Fungal disease caused by Alternaria solani, common in warm, humid conditions.",

        symptoms: [
            "Brown spots with concentric rings on older leaves",
            "Yellowing around spots",
            "Stem lesions near soil line",
            "Fruit rot near stem end",
            "Progressive defoliation from bottom up"
        ],

        organicTreatment: {
            title: "Organic Treatment Options",
            steps: [
                "Remove lower infected leaves",
                "Apply neem oil spray weekly",
                "Use baking soda solution (1 tbsp per gallon)",
                "Apply compost tea to boost immunity",
                "Mulch around plants to prevent soil splash"
            ],
            products: [
                {
                    name: "Neem Oil Organic Fungicide",
                    description: "Natural fungicide for early blight control",
                    link: "https://www.amazon.in/s?k=neem+oil+spray",
                    price: "₹250-400"
                },
                {
                    name: "Organic Copper Fungicide",
                    description: "OMRI-listed copper spray",
                    link: "https://www.amazon.in/s?k=organic+copper+fungicide",
                    price: "₹300-500"
                }
            ]
        },

        chemicalTreatment: {
            title: "Chemical Treatment Options",
            steps: [
                "Apply chlorothalonil at first symptom appearance",
                "Use mancozeb or azoxystrobin every 7-10 days",
                "Alternate fungicide classes to prevent resistance",
                "Ensure thorough coverage of foliage",
                "Continue until 2 weeks before harvest"
            ],
            products: [
                {
                    name: "Chlorothalonil 75% WP",
                    description: "Broad-spectrum fungicide",
                    link: "https://www.amazon.in/s?k=chlorothalonil",
                    price: "₹300-500"
                },
                {
                    name: "Azoxystrobin 23% SC",
                    description: "Systemic fungicide for tomato diseases",
                    link: "https://www.amazon.in/s?k=azoxystrobin",
                    price: "₹400-650"
                }
            ]
        },

        prevention: [
            "Plant resistant varieties",
            "Stake and prune for better air circulation",
            "Water at base, keep foliage dry",
            "Apply mulch to prevent soil splash",
            "Rotate crops annually",
            "Remove plant debris promptly"
        ]
    },

    "Tomato__Late_blight": {
        diseaseName: "Late Blight (Tomato)",
        severity: "Very High - Immediate Action Required",
        description: "Highly destructive disease caused by Phytophthora infestans. Can destroy crop in days.",

        symptoms: [
            "Large, irregular brown/black blotches on leaves",
            "White mold on leaf undersides",
            "Brown lesions on stems",
            "Firm, greasy-looking brown spots on fruit",
            "Rapid plant collapse in humid weather"
        ],

        organicTreatment: {
            title: "Organic Treatment Options",
            steps: [
                "Remove and destroy all infected plants immediately",
                "Apply copper fungicides preventively before symptoms",
                "Use Bacillus subtilis biological control",
                "Improve drainage and air circulation",
                "Harvest unaffected fruit immediately"
            ],
            products: [
                {
                    name: "Copper Sulfate Pentahydrate",
                    description: "Strong copper fungicide for late blight",
                    link: "https://www.amazon.in/s?k=copper+sulfate+fungicide",
                    price: "₹250-400"
                },
                {
                    name: "Bacillus Subtilis QST 713",
                    description: "Biological fungicide for disease suppression",
                    link: "https://www.amazon.in/s?k=bacillus+subtilis",
                    price: "₹350-550"
                }
            ]
        },

        chemicalTreatment: {
            title: "Chemical Treatment Options",
            steps: [
                "Apply metalaxyl + mancozeb immediately",
                "Use cymoxanil or famoxadone for severe cases",
                "Spray every 5-7 days during outbreak",
                "Ensure complete plant coverage",
                "Use spreader-sticker for better adhesion"
            ],
            products: [
                {
                    name: "Metalaxyl 8% + Mancozeb 64%",
                    description: "Systemic and contact fungicide combo",
                    link: "https://www.amazon.in/s?k=metalaxyl+mancozeb",
                    price: "₹350-550"
                },
                {
                    name: "Cymoxanil 8% + Mancozeb 64%",
                    description: "Powerful late blight control",
                    link: "https://www.amazon.in/s?k=cymoxanil",
                    price: "₹400-600"
                }
            ]
        },

        prevention: [
            "Plant resistant varieties (e.g., Mountain Magic, Defiant)",
            "Use certified disease-free transplants",
            "Monitor weather - high risk at 10-25°C with high humidity",
            "Space plants widely for air flow",
            "Use drip irrigation only",
            "Remove volunteer tomato and potato plants nearby"
        ]
    },

    "Tomato_healthy": {
        diseaseName: "Healthy Tomato Plant",
        severity: "None - Excellent Condition",
        description: "Your tomato plant is healthy! Maintain current practices for continued success.",

        symptoms: [
            "Dark green, vibrant foliage",
            "Strong stem and branch structure",
            "Healthy fruit development",
            "No disease symptoms present"
        ],

        organicTreatment: {
            title: "Maintenance Program",
            steps: [
                "Apply compost tea bi-weekly for plant vigor",
                "Use seaweed extract for micronutrients",
                "Maintain consistent watering schedule",
                "Prune suckers for better fruit production",
                "Monitor regularly for early problem detection"
            ],
            products: [
                {
                    name: "Organic Tomato Fertilizer",
                    description: "Balanced NPK for tomato growth",
                    link: "https://www.amazon.in/s?k=organic+tomato+fertilizer",
                    price: "₹200-350"
                },
                {
                    name: "Seaweed Extract Liquid",
                    description: "Natural growth stimulant and stress reducer",
                    link: "https://www.amazon.in/s?k=seaweed+extract",
                    price: "₹250-400"
                }
            ]
        },

        chemicalTreatment: {
            title: "Optimal Nutrition",
            steps: [
                "Apply NPK 19:19:19 during vegetative growth",
                "Switch to NPK 13:0:45 during fruiting",
                "Use calcium nitrate to prevent blossom end rot",
                "Apply micronutrient spray monthly"
            ],
            products: [
                {
                    name: "NPK 13:0:45 Fertilizer",
                    description: "High potassium for fruit development",
                    link: "https://www.amazon.in/s?k=npk+13+0+45",
                    price: "₹250-400"
                },
                {
                    name: "Calcium Nitrate",
                    description: "Prevents blossom end rot",
                    link: "https://www.amazon.in/s?k=calcium+nitrate",
                    price: "₹200-350"
                }
            ]
        },

        prevention: [
            "Continue current excellent practices",
            "Weekly plant inspections",
            "Maintain proper watering (1-2 inches per week)",
            "Ensure good air circulation",
            "Keep area weed-free"
        ]
    },

    // ==================== CAPSICUM/PEPPER DISEASES ====================

    "Pepper__bell___Bacterial_spot": {
        diseaseName: "Bacterial Spot (Bell Pepper)",
        severity: "Medium to High",
        description: "Bacterial disease affecting pepper plants, causing leaf spots and fruit blemishes.",

        symptoms: [
            "Small, dark spots with yellow halos on leaves",
            "Raised, corky spots on fruit",
            "Leaf drop and defoliation",
            "Reduced marketable yield"
        ],

        organicTreatment: {
            title: "Organic Treatment Options",
            steps: [
                "Remove and destroy infected plant parts",
                "Apply copper-based bactericides",
                "Use biological controls (Bacillus species)",
                "Avoid overhead watering completely",
                "Sanitize tools between plants"
            ],
            products: [
                {
                    name: "Copper Hydroxide 77% WP",
                    description: "Organic bactericide for peppers",
                    link: "https://www.amazon.in/s?k=copper+hydroxide+fungicide",
                    price: "₹300-500"
                },
                {
                    name: "Bacillus Pumilus Bio-Bactericide",
                    description: "Natural bacterial disease control",
                    link: "https://www.amazon.in/s?k=bacillus+pumilus",
                    price: "₹350-550"
                }
            ]
        },

        chemicalTreatment: {
            title: "Chemical Treatment Options",
            steps: [
                "Apply streptomycin sulfate at disease onset",
                "Use copper + mancozeb combination",
                "Spray every 7-10 days during wet weather",
                "Rotate with different bactericide classes",
                "Follow label instructions for safety"
            ],
            products: [
                {
                    name: "Streptomycin Sulfate 9% + Tetracycline 1%",
                    description: "Antibiotic bactericide for peppers",
                    link: "https://www.amazon.in/s?k=streptomycin+tetracycline",
                    price: "₹400-650"
                },
                {
                    name: "Copper Oxychloride + Mancozeb",
                    description: "Combination bactericide-fungicide",
                    link: "https://www.amazon.in/s?k=copper+mancozeb",
                    price: "₹250-450"
                }
            ]
        },

        prevention: [
            "Use certified disease-free seeds and transplants",
            "Practice 3-year crop rotation",
            "Avoid working with wet plants",
            "Use drip or furrow irrigation",
            "Space plants 18-24 inches apart",
            "Remove crop debris after harvest",
            "Disinfect greenhouse structures"
        ]
    },

    "Pepper__bell___healthy": {
        diseaseName: "Healthy Bell Pepper Plant",
        severity: "None - Plant is Thriving",
        description: "Your bell pepper plant is in excellent health! Continue your successful growing practices.",

        symptoms: [
            "Lush green foliage",
            "Strong branching structure",
            "Healthy flower and fruit set",
            "No disease or pest damage"
        ],

        organicTreatment: {
            title: "Continued Care & Maintenance",
            steps: [
                "Apply compost or worm castings monthly",
                "Use fish emulsion for nitrogen boost",
                "Maintain consistent moisture levels",
                "Apply neem oil monthly as preventive",
                "Support plants with stakes or cages"
            ],
            products: [
                {
                    name: "Organic Pepper & Vegetable Fertilizer",
                    description: "Complete nutrition for pepper plants",
                    link: "https://www.amazon.in/s?k=organic+vegetable+fertilizer",
                    price: "₹250-400"
                },
                {
                    name: "Fish Emulsion Fertilizer",
                    description: "Organic nitrogen source",
                    link: "https://www.amazon.in/s?k=fish+emulsion+fertilizer",
                    price: "₹200-350"
                },
                {
                    name: "Worm Castings",
                    description: "Premium organic soil amendment",
                    link: "https://www.amazon.in/s?k=worm+castings",
                    price: "₹300-500"
                }
            ]
        },

        chemicalTreatment: {
            title: "Optimal Fertilization",
            steps: [
                "Apply balanced NPK during early growth",
                "Switch to high-potassium formula at flowering",
                "Use calcium and magnesium supplements",
                "Apply micronutrient spray for optimal production"
            ],
            products: [
                {
                    name: "NPK 12:32:16 Fertilizer",
                    description: "Ideal for pepper flowering and fruiting",
                    link: "https://www.amazon.in/s?k=npk+12+32+16",
                    price: "₹200-350"
                },
                {
                    name: "CalMag Supplement",
                    description: "Calcium and magnesium for strong growth",
                    link: "https://www.amazon.in/s?k=calcium+magnesium+fertilizer",
                    price: "₹250-400"
                }
            ]
        },

        prevention: [
            "Maintain current excellent practices",
            "Inspect plants twice weekly",
            "Ensure consistent watering (avoid stress)",
            "Mulch to maintain soil moisture and temperature",
            "Harvest peppers regularly to encourage production"
        ]
    }
};

// Helper function to get treatment plan by disease name
export const getTreatmentPlan = (diseaseName) => {
    // Normalize the disease name
    const normalizedName = diseaseName.trim();

    // Direct lookup
    if (treatmentDatabase[normalizedName]) {
        return treatmentDatabase[normalizedName];
    }

    // Try case-insensitive search
    const lowerCaseName = normalizedName.toLowerCase();
    for (const key in treatmentDatabase) {
        if (key.toLowerCase() === lowerCaseName) {
            return treatmentDatabase[key];
        }
    }

    // Return null if not found
    return null;
};

// Get all available diseases
export const getAllDiseases = () => {
    return Object.keys(treatmentDatabase);
};
