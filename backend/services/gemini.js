import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI successfully initialized with API Key.');
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
  }
} else {
  console.log('No valid Gemini API key found. Operating in Simulation Mode.');
}

// Conversation memory store
// Structure: { [sessionId]: [ { role: 'user'|'model', parts: [ { text: string } ] } ] }
const chatMemories = {};

/**
 * Get or initialize chat memory
 */
function getMemory(sessionId) {
  if (!chatMemories[sessionId]) {
    chatMemories[sessionId] = [];
  }
  return chatMemories[sessionId];
}

/**
 * Clear chat memory
 */
export function clearMemory(sessionId) {
  chatMemories[sessionId] = [];
}

/**
 * Handle AI Chat in a multilingual, personalized conversation
 */
export async function chatSession(sessionId, message, language = 'English', userProfile = {}, availableSchemes = []) {
  const memory = getMemory(sessionId);
  const langPrompt = getLanguagePrompt(language);
  const profileContext = userProfile && Object.keys(userProfile).length > 0 
    ? `User Profile Context:
- Age: ${userProfile.age || 'Not provided'}
- Gender: ${userProfile.gender || 'Not provided'}
- Occupation: ${userProfile.occupation || 'Not provided'}
- Income (Annual): ₹${userProfile.income || 'Not provided'}
- State: ${userProfile.state || 'Not provided'}
- Education: ${userProfile.education || 'Not provided'}
- Disability: ${userProfile.disability ? 'Yes' : 'No'}
- Caste: ${userProfile.caste || 'Not provided'}
- Farmer Status: ${userProfile.isFarmer ? 'Yes' : 'No'}` 
    : 'User Profile Context: No profile filled in yet.';

  const schemesContext = `Available Government Schemes in database:
${availableSchemes.map(s => `- ${s.name} (${s.category}): ${s.description}`).join('\n')}`;

  const systemInstruction = `You are "Scheme Sathi", a helpful, empathetic, and knowledgeable Indian government schemes assistant.
${langPrompt}
${profileContext}
${schemesContext}

Instructions:
1. Provide accurate information based on the schemes provided.
2. Recommend suitable schemes from the list based on the user's profile.
3. If they ask about eligibility, break it down clearly.
4. Keep answers clean, formatted with bullet points, and concise.
5. Provide a short follow-up question at the end to guide the conversation (e.g., "Would you like me to check your eligibility for Ayushman Bharat?" or "మీకు సుకన్య సమృద్ధి యోజన గురించి మరిన్ని వివరాలు కావాలా?").
6. IMPORTANT: Always respond directly in the selected language (${language}). Do not translate literally, speak naturally.`;

  // Push user message to history
  memory.push({ role: 'user', parts: [{ text: message }] });
  
  // Keep last 10 messages for context window management
  if (memory.length > 15) {
    memory.splice(0, memory.length - 15);
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction
      });

      // Format history for Gemini SDK
      // Note: first item must be user message, roles must alternate user/model
      const chat = model.startChat({
        history: memory.slice(0, -1) // pass historical turns
      });

      const response = await chat.sendMessage(message);
      const text = response.response.text();
      
      // Store assistant response
      memory.push({ role: 'model', parts: [{ text: text }] });
      return { text, source: 'Gemini AI' };
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      // Fallback to simulation if rate-limited or key error
    }
  }

  // Simulation Mode Response
  const simResponse = getSimulatedChatResponse(message, language, userProfile, availableSchemes, memory);
  memory.push({ role: 'model', parts: [{ text: simResponse }] });
  return { text: simResponse, source: 'Scheme Sathi Simulator' };
}

/**
 * AI-driven Scheme Eligibility Checker
 */
export async function checkEligibility(scheme, userProfile, language = 'English') {
  const profileDesc = JSON.stringify(userProfile);
  const schemeDesc = JSON.stringify(scheme);

  const prompt = `Evaluate if the user is eligible for the following scheme:
Scheme details: ${schemeDesc}
User Profile: ${profileDesc}

Provide a detailed evaluation in ${language} language. Return a JSON structure with these fields:
{
  "eligible": true or false,
  "reason": "summary explanation in ${language}",
  "details": [
    { "criteria": "Age", "status": "Matched" or "Not Matched" or "Not Applicable", "details": "explanation in ${language}" },
    { "criteria": "Gender", "status": "...", "details": "..." },
    { "criteria": "Income", "status": "...", "details": "..." },
    { "criteria": "Occupation", "status": "...", "details": "..." },
    { "criteria": "Farmer Status", "status": "...", "details": "..." }
  ]
}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Gemini Eligibility Check Error:', error);
    }
  }

  // Simulation fallback
  return runRuleBasedEligibility(scheme, userProfile, language);
}

/**
 * Natural Language Scheme Finder
 */
export async function searchSchemes(query, schemes, language = 'English') {
  const prompt = `Given the user search query: "${query}"
And this list of schemes: ${JSON.stringify(schemes.map(s => ({ id: s.id, name: s.name, description: s.description, category: s.category })))}

Determine which schemes are relevant to the user query.
Return a JSON array of scheme IDs that are matches. Example: ["pm-kisan", "pm-mudra"].
Return only the JSON array and nothing else.`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const matchedIds = JSON.parse(responseText);
      
      if (Array.isArray(matchedIds)) {
        return schemes.filter(s => matchedIds.includes(s.id));
      }
    } catch (error) {
      console.error('Gemini Scheme Search Error:', error);
    }
  }

  // Fallback keyword search
  const lowerQuery = query.toLowerCase();
  return schemes.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) || 
    s.description.toLowerCase().includes(lowerQuery) || 
    s.category.toLowerCase().includes(lowerQuery) ||
    (s.name_te && s.name_te.includes(query)) ||
    (s.description_te && s.description_te.includes(query)) ||
    (s.name_hi && s.name_hi.includes(query)) ||
    (s.description_hi && s.description_hi.includes(query))
  );
}

/**
 * OCR Document Extraction
 */
export async function ocrDocument(imageBuffer, mimeType, language = 'English') {
  const prompt = `You are an expert government document reader.
Analyze this uploaded document image (Aadhaar card, Income Certificate, Ration card, or Farmer passbook).
1. Perform OCR and extract details.
2. Structure the data in JSON format:
{
  "documentType": "Aadhaar Card" or "Income Certificate" or "Other",
  "name": "Full name found",
  "idNumber": "Document ID number (e.g. Aadhaar no, PAN no)",
  "dob": "Date of Birth (if found)",
  "gender": "Gender (if found)",
  "income": "Annual or Monthly income value (if found)",
  "state": "State of Residence (if found)",
  "rawText": "Brief summary of other extracted details"
}
Ensure all descriptions and fields are translated/explained in ${language}. Return ONLY the JSON.`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imageParts = [{
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      }];
      
      const result = await model.generateContent([prompt, ...imageParts]);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error('Gemini OCR Error:', error);
    }
  }

  // Simulated OCR extract based on filename or dummy processing
  return {
    documentType: "Aadhaar Card (Simulated OCR)",
    name: "Anirudh Kumar",
    idNumber: "XXXX-XXXX-8942",
    dob: "1995-08-15",
    gender: "Male",
    income: null,
    state: "Andhra Pradesh",
    rawText: "Aadhaar card scan. Verified name, DOB, and biometric registration."
  };
}

// Helpers
function getLanguagePrompt(language) {
  if (language === 'Telugu') {
    return 'భాషా సూచనలు: మీరు తెలుగులో సమాధానం చెప్పాలి. సంభాషణ తెలుగులోనే జరగాలి. (Speak in natural, clean Telugu script).';
  } else if (language === 'Hindi') {
    return 'भाषा निर्देश: आपको हिंदी में उत्तर देना होगा। बातचीत केवल हिंदी में ही होनी चाहिए। (Speak in natural, clean Devanagari Hindi script).';
  }
  return 'Language instructions: You must speak in English. Keep the tone helpful and professional.';
}

/**
 * Fallback Rule-Based Eligibility Engine
 */
export function runRuleBasedEligibility(scheme, profile, language) {
  const details = [];
  let isEligible = true;

  const rules = scheme.eligibility;

  // Age Check
  if (rules.age_min !== null && profile.age !== undefined) {
    const age = parseInt(profile.age);
    const minMatched = age >= rules.age_min;
    const maxMatched = rules.age_max === null || age <= rules.age_max;
    const ok = minMatched && maxMatched;
    if (!ok) isEligible = false;
    
    details.push({
      criteria: "Age Limit",
      status: ok ? "Matched" : "Not Matched",
      details: language === 'Telugu' 
        ? `పథకం పరిమితి: ${rules.age_min}-${rules.age_max || 'అపరిమిత'} సంవత్సరాలు. మీ వయస్సు: ${age} సంవత్సరాలు.` 
        : `Scheme requires age between ${rules.age_min} and ${rules.age_max || 'No limit'}. Your age: ${age}.`
    });
  }

  // Gender Check
  if (rules.gender !== 'Any' && profile.gender) {
    const ok = profile.gender.toLowerCase() === rules.gender.toLowerCase();
    if (!ok) isEligible = false;
    details.push({
      criteria: "Gender Eligibility",
      status: ok ? "Matched" : "Not Matched",
      details: language === 'Telugu' 
        ? `పథకం కేటాయింపు: ${rules.gender}. మీ లింగం: ${profile.gender}.` 
        : `Scheme is for ${rules.gender}. Your gender: ${profile.gender}.`
    });
  }

  // Income Check
  if (rules.income_max !== null && profile.income !== undefined && profile.income !== '') {
    const income = parseInt(profile.income);
    const ok = income <= rules.income_max;
    if (!ok) isEligible = false;
    details.push({
      criteria: "Annual Income Limit",
      status: ok ? "Matched" : "Not Matched",
      details: language === 'Telugu' 
        ? `పథకం గరిష్ట ఆదాయం: ₹${rules.income_max}. మీ వార్షిక ఆదాయం: ₹${income}.` 
        : `Maximum allowed income: ₹${rules.income_max}. Your income: ₹${income}.`
    });
  }

  // Farmer Check
  if (rules.farmer_only && profile.isFarmer !== undefined) {
    const ok = profile.isFarmer === true || String(profile.isFarmer).toLowerCase() === 'true';
    if (!ok) isEligible = false;
    details.push({
      criteria: "Farmer Status Check",
      status: ok ? "Matched" : "Not Matched",
      details: language === 'Telugu'
        ? `ఈ పథకం రైతులకు మాత్రమే వర్తిస్తుంది. రైతు స్థితి: ${ok ? 'అవును' : 'కాదు'}.`
        : `This scheme is exclusively for farmers. Farmer status: ${ok ? 'Yes' : 'No'}.`
    });
  }

  // Occupation Check
  if (rules.occupation && !rules.occupation.includes('Any') && profile.occupation) {
    const userOcc = profile.occupation.toLowerCase();
    const ok = rules.occupation.some(o => o.toLowerCase() === userOcc);
    if (!ok) isEligible = false;
    details.push({
      criteria: "Occupation Check",
      status: ok ? "Matched" : "Not Matched",
      details: language === 'Telugu'
        ? `అర్హత కలిగిన వృత్తులు: ${rules.occupation.join(', ')}. మీ వృత్తి: ${profile.occupation}.`
        : `Eligible occupations: ${rules.occupation.join(', ')}. Your occupation: ${profile.occupation}.`
    });
  }

  // General state check
  if (rules.state && !rules.state.includes('All') && profile.state) {
    const ok = rules.state.some(s => s.toLowerCase() === profile.state.toLowerCase());
    if (!ok) isEligible = false;
    details.push({
      criteria: "State Residence",
      status: ok ? "Matched" : "Not Matched",
      details: language === 'Telugu'
        ? `వర్తించే రాష్ట్రాలు: ${rules.state.join(', ')}. మీ రాష్ట్రం: ${profile.state}.`
        : `Applicable states: ${rules.state.join(', ')}. Your state: ${profile.state}.`
    });
  }

  // If no detailed checks failed and details list is empty, default it
  if (details.length === 0) {
    details.push({
      criteria: "General Rules",
      status: "Matched",
      details: language === 'Telugu' ? "అన్ని ప్రాథమిక అర్హత నిబంధనలు సరిపోయాయి." : "All basic scheme rules matched."
    });
  }

  const reason = isEligible 
    ? (language === 'Telugu' 
        ? "మీరు ఈ పథకానికి అర్హులు! దరఖాస్తు చేసుకోవడానికి క్రింది దశలను అనుసరించండి." 
        : "You meet the primary criteria for this scheme! Please review the documents checklist below.")
    : (language === 'Telugu' 
        ? "క్షమించండి, మీరు ఈ పథకానికి కొన్ని అర్హత ప్రమాణాలను అందుకోలేదు." 
        : "You do not meet one or more eligibility criteria for this scheme.");

  return {
    eligible: isEligible,
    reason,
    details
  };
}

/**
 * Simulated Chat Response Generator for offline / API Key missing mode
 */
function getSimulatedChatResponse(message, language, profile, schemes, history) {
  const msg = message.toLowerCase();
  
  if (language === 'Telugu') {
    if (msg.includes('నమస్కారం') || msg.includes('హలో') || msg.includes('hi') || msg.includes('hello')) {
      return `నమస్కారం! నేను స్కీమ్ సాథి (Scheme Sathi) సహాయకుడిని. నేను మీకు వివిధ ప్రభుత్వ పథకాల గురించి సమాచారాన్ని అందించగలను. 

మీ వయస్సు, వృత్తి మరియు ఆదాయ వివరాల ఆధారంగా మీకు సరిపోయే పథకాలను నేను సూచించగలను. 

మీరు ఏ పథకం గురించి తెలుసుకోవాలనుకుంటున్నారు?`;
    }
    if (msg.includes('రైతు') || msg.includes('వ్యవసాయం') || msg.includes('కిసాన్') || msg.includes('kisan')) {
      return `రైతుల కోసం మన వద్ద అత్యంత ప్రజాదరణ పొందిన పథకం **ప్రధానమంత్రి కిసాన్ సమ్మాన్ నిధి (PM-KISAN)** ఉంది. 
ఈ పథకం కింద చిన్న మరియు సన్నకారు రైతులకు ప్రతి సంవత్సరం ₹6,000 మూడు విడతలలో లభిస్తుంది.

మీ ప్రొఫైల్ ప్రకారం మీరు రైతుగా నమోదైతే, మీరు దీనికి అర్హులవుతారు. 

నేను మీ అర్హతను తనిఖీ చేయాలా?`;
    }
    if (msg.includes('ఆరోగ్య') || msg.includes('ఆసుపత్రి') || msg.includes('వైద్యం') || msg.includes('health') || msg.includes('ayushman')) {
      return `ఆరోగ్య భీమా కోసం **ఆయుష్మాన్ భారత్ (PM-JAY)** పథకం ఉంది. దీని ద్వారా అర్హులైన కుటుంబాలు సంవత్సరానికి ₹5 లక్షల వరకు ఉచిత నగదు రహిత చికిత్సను పొందవచ్చు.

మీ వార్షిక ఆదాయం ₹1.5 లక్షల కంటే తక్కువగా ఉంటే, మీరు దీనికి సులభంగా అర్హులవుతారు.

దీని గురించి మరింత సమాచారం కావాలా?`;
    }
    if (msg.includes('పిల్లలు') || msg.includes('ఆడపిల్ల') || msg.includes('sukanya') || msg.includes('సుకన్య')) {
      return `ఆడపిల్లల భవిష్యత్తు కోసం **సుకన్య సమృద్ధి యోజన (SSY)** చాలా మంచి పథకం. 10 సంవత్సరాల లోపు వయసున్న ఆడపిల్లల పేరు మీద తల్లిదండ్రులు ఈ ఖాతాను తెరవవచ్చు. దీనికి ప్రస్తుతం 8.2% వడ్డీ లభిస్తుంది మరియు పన్ను మినహాయింపు ఉంటుంది.

మీరు ఈ పథకం యొక్క దరఖాస్తు విధానాన్ని తెలుసుకోవాలనుకుంటున్నారా?`;
    }
    return `మీ ప్రశ్నను నేను స్వీకరించాను: "${message}".
స్కీమ్ సాథి (Scheme Sathi) ద్వారా మీరు PM-KISAN, ఆయుష్మాన్ భారత్, సుకన్య సమృద్ధి యోజన, మరియు ముద్రా లోన్ల వంటి పథకాల వివరాలను తెలుసుకోవచ్చు.

మీ ప్రొఫైల్ వివరాలను నవీకరించడం ద్వారా మీకు సరిపోయే పథకాలను మేము స్వయంచాలకంగా సిఫార్సు చేస్తాము.

మీరు ఏ పథకం యొక్క పూర్తి వివరాలు చూడాలనుకుంటున్నారు?`;
  }

  // English Simulated Responses
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! I am Scheme Sathi, your AI government schemes assistant. I can help you search, compare, and check eligibility for various central and state government schemes.

To give you personalized recommendations, please fill out your profile details on the dashboard (Age, Gender, Occupation, Income, State).

How can I help you today?`;
  }
  if (msg.includes('farmer') || msg.includes('kisan') || msg.includes('agriculture')) {
    return `For farmers, the most popular scheme is **Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)**. It provides ₹6,000 per year directly into your bank account. 
Another beneficial scheme is the crop insurance program or PM Fasal Bima Yojana.

Would you like me to check your eligibility for PM-KISAN or explain how to apply?`;
  }
  if (msg.includes('health') || msg.includes('hospital') || msg.includes('medical') || msg.includes('ayushman')) {
    return `For healthcare coverage, you should look into **Ayushman Bharat (PM-JAY)**, which offers ₹5 Lakh free health cover per family per year for secondary/tertiary hospital treatments.

Would you like to check if your profile qualifies for Ayushman Bharat?`;
  }
  if (msg.includes('girl') || msg.includes('daughter') || msg.includes('sukanya') || msg.includes('ssy')) {
    return `For girl child savings, the **Sukanya Samriddhi Yojana (SSY)** is highly recommended. It offers a very high interest rate of ~8.2% and absolute tax benefits. It is for girls below 10 years of age.

Should I show you the documents required to open an SSY account?`;
  }
  if (msg.includes('loan') || msg.includes('business') || msg.includes('mudra') || msg.includes('money')) {
    return `For starting or expanding a business, the **Pradhan Mantri Mudra Yojana (PMMY)** offers collateral-free loans up to ₹10 Lakh in categories like Shishu, Kishor, and Tarun.

Would you like to see the application guide for a Mudra loan?`;
  }

  return `Thank you for asking! I'm analyzing your query: "${message}". 
Based on our database, you can search for agriculture, healthcare, finance, or girl child schemes. 

Please make sure to set up your Profile (Age, Gender, Occupation, Income) so I can personalize these suggestions. 

Would you like me to guide you on how to check your eligibility?`;
}

/**
 * Call Agent Conversational Service (Telugu Helpdesk)
 */
export async function chatCallAgent(sessionId, message, availableSchemes = [], userProfile = {}) {
  const memory = getMemory(sessionId);
  
  const schemesContext = availableSchemes.map(s => `- ${s.name} (ID: ${s.id}): ${s.description}`).join('\n');
  
  const systemInstruction = `మీరు భారతదేశ ప్రభుత్వ పథకాల హెల్ప్‌లైన్ అధికారి "కీర్తి" (Keerthi).
మీరు ఫోన్ కాల్‌లో పౌరులతో మాట్లాడుతున్నారు.
1. కేవలం శుద్ధమైన మరియు మర్యాదపూర్వకమైన తెలుగు భాషలోనే మాట్లాడండి. (Speak ONLY in Telugu).
2. మీ సమాధానాలు చాలా సంక్షిప్తంగా (గరిష్టంగా 2-3 వాక్యాలు) ఉండాలి, ఎందుకంటే ఇది ఫోన్ సంభాషణ. సుదీర్ఘమైన సమాధానాలు ఇవ్వకండి.
3. పౌరుడు తన పరిస్థితిని వివరిస్తే, అనుకూలమైన పథకాలను గుర్తించడానికి వారి వయస్సు, వృత్తి, వార్షిక ఆదాయం మరియు రాష్ట్రం వంటి వివరాలను ఒకదాని తర్వాత ఒకటి అడగండి (అన్నీ ఒకేసారి అడగకండి).
4. పౌరుడు అర్హత సాధించిన పథకాలను సిఫార్సు చేయండి మరియు వాటి లబ్ధిని సులభంగా వివరించండి.
5. ఎల్లప్పుడూ మర్యాదగా మరియు ఆదరపూర్వకంగా సంభాషించండి.

ప్రస్తుత డేటాబేస్ లోని పథకాలు:
${schemesContext}

వినియోగదారు ప్రొఫైల్ వివరాలు:
- వయస్సు: ${userProfile.age || 'తెలియదు'}
- లింగం: ${userProfile.gender || 'తెలియదు'}
- వృత్తి: ${userProfile.occupation || 'తెలియదు'}
- ఆదాయం: ₹${userProfile.income || 'తెలియదు'}
- రాష్ట్రం: ${userProfile.state || 'తెలియదు'}
- రైతు స్థితి: ${userProfile.isFarmer ? 'అవును' : 'కాదు'}`;

  // Register message
  memory.push({ role: 'user', parts: [{ text: message }] });

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: memory.slice(0, -1)
      });

      const response = await chat.sendMessage(message);
      const text = response.response.text();
      
      memory.push({ role: 'model', parts: [{ text }] });
      return { text, source: 'Gemini Call Agent' };
    } catch (error) {
      console.error('Call Agent Gemini Error:', error);
    }
  }

  // Simulator for Telugu Call Agent
  const replyText = getSimulatedCallReply(message, memory, userProfile);
  memory.push({ role: 'model', parts: [{ text: replyText }] });
  return { text: replyText, source: 'Call Agent Simulator' };
}

function getSimulatedCallReply(message, memory, profile) {
  const msg = message.toLowerCase();
  
  if (msg.includes('హలో') || msg.includes('నమస్కారం') || msg.includes('hello') || msg.includes('hi')) {
    return 'నమస్కారం అండి! నేను ప్రభుత్వ పథకాల సహాయ అధికారి కీర్తిని మాట్లాడుతున్నాను. మీకు ఏ పథకం గురించి సమాచారం కావాలి?';
  }
  
  if (msg.includes('రైతు') || msg.includes('వ్యవసాయం') || msg.includes('farmer') || msg.includes('kisan')) {
    if (!profile.age) {
      return 'రైతుల కోసం మన వద్ద ప్రధానమంత్రి కిసాన్ సమ్మాన్ నిధి పథకం ఉందండి. మీ వయస్సు మరియు వార్షిక ఆదాయం ఎంతో చెప్పగలరా?';
    }
    return 'రైతులకు ప్రతి సంవత్సరం ₹6,000 అందించే పి.ఎమ్ కిసాన్ పథకానికి మీరు అర్హులండి. దరఖాస్తు చేసుకోవడానికి మీకు ఆధార్ కార్డ్ మరియు పట్టాదారు పాస్ బుక్ అవసరం అవుతాయి.';
  }

  if (msg.includes('ఆరోగ్య') || msg.includes('వైద్యం') || msg.includes('hospital') || msg.includes('ayushman')) {
    return 'ఆరోగ్య సహాయం కోసం ఆయుష్మాన్ భారత్ యోజన ఉందండి. దీని ద్వారా సంవత్సరానికి ₹5 లక్షల వరకు ఉచిత వైద్య సహాయం లభిస్తుంది. మీ వార్షిక ఆదాయం ఎంత ఉందో చెప్పగలరా?';
  }

  if (msg.includes('ఆడపిల్ల') || msg.includes('కూతురు') || msg.includes('sukanya') || msg.includes('సుకన్య')) {
    return 'ఆడపిల్లల భవిష్యత్తు పొదుపు కోసం సుకన్య సమృద్ధి యోజన చాలా మంచి పథకం అండి. మీ అమ్మాయి వయస్సు పది సంవత్సరాల లోపు ఉందా?';
  }

  if (msg.includes('ధన్యవాదాలు') || msg.includes('థాంక్స్') || msg.includes('thanks') || msg.includes('thank you')) {
    return 'ధన్యవాదాలు అండి! ప్రభుత్వ పథకాల హెల్ప్‌లైన్‌కు కాల్ చేసినందుకు సంతోషం. మీకు ఏ క్షణంలోనైనా సహాయం చేయడానికి నేను సిద్ధంగా ఉంటాను. సెలవు!';
  }

  // Ask for state or income if not clear
  if (!profile.state) {
    return 'ధన్యవాదాలు. పథకాల అర్హత సరిగ్గా తెలుసుకోవడానికి మీరు ఏ రాష్ట్రంలో నివసిస్తున్నారో చెప్పగలరా?';
  }

  return 'నమస్కారం అండి! మీ వివరాల ప్రకారం వ్యవసాయదారులకు పి.ఎమ్ కిసాన్, వైద్య సహాయానికి ఆయుష్మాన్ భారత్, మరియు చిన్న వ్యాపారాలకు ముద్రా లోన్లు అందుబాటులో ఉన్నాయి. మీకు వీటిలో దేనిపై ఆసక్తి ఉంది?';
}

