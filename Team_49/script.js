let selectedFile = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('img');
const preview = document.getElementById('preview');
const predictBtn = document.getElementById('predictBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorText = document.getElementById('errorText');
const infoText = document.getElementById('infoText');
const deficiencyText = document.getElementById('deficiencyText');
const dietText = document.getElementById('dietText');

// Database with all conditions
const suggestionsDB = {
    'Acral_Lentiginous_Melanoma': {
        result: 'Acral Lentiginous Melanoma',
        info: 'Dark spot or growth on palm, sole, or nail bed. This is a serious skin cancer that needs urgent medical attention.',
        deficiency: 'Skin Cancer (Melanoma)',
        diet: 'URGENT: See a doctor within 48 hours. Get biopsy and imaging done immediately.'
    },
    'alopecia-vitD-IRON': {
        result: 'Hair Loss (Vitamin D & Iron Deficiency)',
        info: 'Your hair is falling out or thinning due to lack of Vitamin D and Iron.',
        deficiency: 'Vitamin D & Iron Deficiency',
        diet: 'Eat fatty fish (salmon), egg, fortified milk, red meat, chicken, spinach, lentils, and beans. Take Vitamin D supplement (1000-2000 IU) and Iron supplement (325mg) daily. Hair regrowth visible in 3-6 months.'
    },
    'blue_finger': {
        result: 'Poor Blood Flow (Cyanosis)',
        info: 'Blue fingers indicate poor blood flow and oxygen circulation to hands.',
        deficiency: 'Poor Oxygen & Blood Circulation',
        diet: 'See a cardiologist urgently for ECG and chest X-ray. Keep hands warm, stop smoking, exercise daily. Maintain heart health with regular activity and stress management.'
    },
    'dandruff-VITB COMPLEX-ZINC': {
        result: 'Dandruff (B Vitamins & Zinc Deficiency)',
        info: 'White flakes on scalp and hair due to missing B vitamins and Zinc.',
        deficiency: 'B Vitamins & Zinc Deficiency',
        diet: 'Eat eggs, fish, whole wheat, nuts, seeds, oysters, beef, pumpkin seeds, chickpeas, and yogurt. Take B-Complex vitamin and Zinc (15-30mg) daily. Use anti-dandruff shampoo 2-3 times a week. Improvement in 2-4 weeks.'
    },
    'Healthy': {
        result: 'Healthy - No Issues',
        info: 'Great! Your hair, skin, and nails look healthy with no nutritional deficiencies detected.',
        deficiency: 'No Deficiency Detected',
        diet: 'Continue eating balanced meals with vegetables, fruits, meat, grains, nuts, and seeds. Stay active, drink plenty of water, and get 8 hours of sleep daily.'
    },
    'Vitamin A': {
        result: 'Vitamin A Deficiency',
        info: 'Skin looks dry and hair is weak due to lack of Vitamin A.',
        deficiency: 'Vitamin A Deficiency',
        diet: 'Eat carrots, sweet potato, pumpkin, spinach, kale, broccoli, eggs, liver, cheese, and milk daily. Take Vitamin A supplement (5000-10000 IU) daily. Skin improves in 2-3 weeks.'
    },
    'Vitamin_E_deficiency': {
        result: 'Vitamin E Deficiency',
        info: 'Skin is dry and dull, hair is weak due to lack of Vitamin E.',
        deficiency: 'Vitamin E Deficiency',
        diet: 'Eat almonds, sunflower seeds, olive oil, avocado, spinach, kale, and peanut butter daily. Take Vitamin E supplement (400-800 IU) with meals. Skin improves in 2-3 weeks.'
    },
    'zinc,iron,biotin or prot def': {
        result: 'Multiple Deficiencies (Zinc, Iron, Biotin, Protein)',
        info: 'Hair loss, weak nails, and dull skin indicate multiple nutritional deficiencies.',
        deficiency: 'Zinc + Iron + Biotin + Protein Deficiency',
        diet: 'Eat eggs, chicken, fish, beef, yogurt, beans, lentils, pumpkin seeds, and almonds daily (aim 60-80g protein). Take Iron, Zinc, and Biotin supplements daily. Add 1 handful almonds to daily diet. Results visible in 3-6 months.'
    }
};

// Find matching class
function findMatchingClass(prediction) {
    const cleanPrediction = prediction.trim();
    
    // Exact match
    if (suggestionsDB[cleanPrediction]) {
        return cleanPrediction;
    }
    
    // Case-insensitive match
    for (let key in suggestionsDB) {
        if (key.toLowerCase() === cleanPrediction.toLowerCase()) {
            return key;
        }
    }
    
    // Partial match
    for (let key in suggestionsDB) {
        if (cleanPrediction.includes(key) || key.includes(cleanPrediction)) {
            return key;
        }
    }
    
    return null;
}

// Drag and drop listeners
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        handleFileSelect();
    }
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

// Handle file selection
function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    selectedFile = file;
    resultsSection.classList.remove('show');
    errorDiv.classList.remove('show');
    uploadArea.style.display = 'none';

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Button listeners
predictBtn.addEventListener('click', upload);
clearBtn.addEventListener('click', clearForm);

// Upload and predict
async function upload() {
    if (!selectedFile) {
        showError('Please select an image first');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    loading.style.display = 'block';
    resultsSection.classList.remove('show');
    errorDiv.classList.remove('show');
    predictBtn.disabled = true;

    try {
        const res = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.error) {
            showError(data.error);
        } else {
            const prediction = data.prediction.trim();
            const matchedClass = findMatchingClass(prediction);
            const suggestionData = matchedClass ? suggestionsDB[matchedClass] : null;

            if (suggestionData) {
                result.innerText = suggestionData.result;
                infoText.innerText = suggestionData.info;
                deficiencyText.innerText = suggestionData.deficiency;
                dietText.innerText = suggestionData.diet;
            } else {
                result.innerText = prediction;
                infoText.innerText = 'Detected: ' + prediction;
                deficiencyText.innerText = 'Please consult a healthcare provider for proper diagnosis.';
                dietText.innerText = 'Get professional medical advice for treatment plan.';
            }

            resultsSection.classList.add('show');
        }
    } catch (err) {
        showError('Connection failed. Try again.');
        console.error(err);
    } finally {
        loading.style.display = 'none';
        predictBtn.disabled = false;
    }
}

// Clear form
function clearForm() {
    fileInput.value = '';
    selectedFile = null;
    preview.style.display = 'none';
    preview.src = '';
    resultsSection.classList.remove('show');
    errorDiv.classList.remove('show');
    uploadArea.style.display = 'block';
}

// Show error
function showError(msg) {
    errorText.innerText = '❌ ' + msg;
    errorDiv.classList.add('show');
}
