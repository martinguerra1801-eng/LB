export interface Question {
  id: number;
  question: string;
  correctAnswer: string;
  options: string[]; // Shuffled list containing correct answer + 3 distractors
}

export const rawQuestions = [
  {
    id: 1,
    question: "What does Lizzie love doing?",
    correctAnswer: "She loves horse riding.",
    distractors: [
      "She loves swimming in the lake.",
      "She loves playing the guitar.",
      "She loves drawing pictures."
    ]
  },
  {
    id: 2,
    question: "How many shops are there in Little Bridge?",
    correctAnswer: "There is one shop.",
    distractors: [
      "There are three shops.",
      "There are five shops.",
      "There are no shops."
    ]
  },
  {
    id: 3,
    question: "Who works in a shop in Little Bridge?",
    correctAnswer: "Mr and Mrs Kumar.",
    distractors: [
      "Mr and Mrs Wood.",
      "Mrs MacKenzie and Mr Miller.",
      "Toby and David Carter."
    ]
  },
  {
    id: 4,
    question: "What's the name of the hospital?",
    correctAnswer: "There is no hospital.",
    distractors: [
      "Little Bridge General Hospital.",
      "St. Jude Hospital.",
      "The Central Clinic."
    ]
  },
  {
    id: 5,
    question: "What is Rose's father's job?",
    correctAnswer: "He is a journalist.",
    distractors: [
      "He is a dentist.",
      "He is an accountant.",
      "He is a school teacher."
    ]
  },
  {
    id: 6,
    question: "What colour is Domino?",
    correctAnswer: "He is black and white.",
    distractors: [
      "He is completely black.",
      "He is brown and white.",
      "He is grey and white."
    ]
  },
  {
    id: 7,
    question: "How old is Rose's mother?",
    correctAnswer: "She is thirty-six years old.",
    distractors: [
      "She is forty years old.",
      "She is thirty-two years old.",
      "She is forty-two years old."
    ]
  },
  {
    id: 8,
    question: "What is the name of Rose's mother?",
    correctAnswer: "Her name is Jenny.",
    distractors: [
      "Her name is Lizzie.",
      "Her name is Grace.",
      "Her name is Kate."
    ]
  },
  {
    id: 9,
    question: "What was Rose's mother job before she had children?",
    correctAnswer: "She worked as an accountant.",
    distractors: [
      "She worked as a teacher.",
      "She worked as a journalist.",
      "She worked as a dentist."
    ]
  },
  {
    id: 10,
    question: "Who has got two cats called Lenny and Lulu?",
    correctAnswer: "Toby has got two cats called Lenny and Lulu.",
    distractors: [
      "David has got two cats called Lenny and Lulu.",
      "James has got two cats called Lenny and Lulu.",
      "Lizzie has got two cats called Lenny and Lulu."
    ]
  },
  {
    id: 11,
    question: "Does Grace have a pet?",
    correctAnswer: "Yes she does. She has got a cat.",
    distractors: [
      "No she doesn't.",
      "Yes she does. She has got a dog.",
      "Yes she does. She has got a horse."
    ]
  },
  {
    id: 12,
    question: "What kind of music does Rose love singing?",
    correctAnswer: "She loves singing pop music.",
    distractors: [
      "She loves singing rock music.",
      "She loves singing classical music.",
      "She loves singing jazz music."
    ]
  },
  {
    id: 13,
    question: "How old is David?",
    correctAnswer: "He is eleven years old.",
    distractors: [
      "He is nine years old.",
      "He is twelve years old.",
      "She is ten years old."
    ]
  },
  {
    id: 14,
    question: "What is Rose's favourite school subject?",
    correctAnswer: "Her favourite subject is Geography.",
    distractors: [
      "Her favourite subject is Maths.",
      "His favourite subject is History.",
      "Her favourite subject is Science."
    ]
  },
  {
    id: 15,
    question: "Who is Rose's school teacher?",
    correctAnswer: "Her teacher is Mrs MacKenzie.",
    distractors: [
      "Her teacher is Mrs Kumar.",
      "Her teacher is Mrs Wood.",
      "Her teacher is Mr Miller."
    ]
  },
  {
    id: 16,
    question: "What is Rose's favourite pizza?",
    correctAnswer: "She loves vegetarian pizza.",
    distractors: [
      "She loves pepperoni pizza.",
      "She loves cheese pizza.",
      "She loves Hawaiian pizza."
    ]
  },
  {
    id: 17,
    question: "What is Rose's favourite sport?",
    correctAnswer: "Her favourite sport is swimming.",
    distractors: [
      "Her favourite sport is golf.",
      "Her favourite sport is football.",
      "Her favourite sport is horse riding."
    ]
  },
  {
    id: 18,
    question: "Who is very good at sport?",
    correctAnswer: "James is very good at sport.",
    distractors: [
      "Rajiv is very good at sport.",
      "Mr Miller is very good at sport.",
      "Matthew is very good at sport.",
      "Sam is an excellent dancer.",
      "David is very good at gardening."
    ]
  },
  {
    id: 19,
    question: "How old is Geeta?",
    correctAnswer: "She is ten years old.",
    distractors: [
      "She is eight years old.",
      "He is ten years old.",
      "She is five years old."
    ]
  },
  {
    id: 20,
    question: "How many languages does Rose speak?",
    correctAnswer: "She only speaks English.",
    distractors: [
      "She speaks English and Spanish.",
      "She speaks three languages.",
      "She speaks English and French."
    ]
  },
  {
    id: 21,
    question: "Does Mrs MacKenzie have any children?",
    correctAnswer: "No, she doesn't.",
    distractors: [
      "Yes, she has got a son.",
      "Yes, she has got two daughters.",
      "Yes, she has got a son and a daughter."
    ]
  },
  {
    id: 22,
    question: "What is the name of Mrs MacKenzie's dog?",
    correctAnswer: "His name is Charlie.",
    distractors: [
      "His name is Domino.",
      "His name is Lenny.",
      "His name is Lulu."
    ]
  },
  {
    id: 23,
    question: "What colour is Charlie (pet)?",
    correctAnswer: "He is a lovely brown dog.",
    distractors: [
      "He is a black and white dog.",
      "He is a white dog.",
      "He is a black dog."
    ]
  },
  {
    id: 24,
    question: "How old is Charlie?",
    correctAnswer: "He is ten years old.",
    distractors: [
      "He is three years old.",
      "He is seven years old.",
      "He is five years old."
    ]
  },
  {
    id: 25,
    question: "Why is Sam too young to be at school?",
    correctAnswer: "He is a little baby.",
    distractors: [
      "He is only five years old.",
      "He is ill.",
      "He is too busy playing."
    ]
  },
  {
    id: 26,
    question: "Who is Sam's older brother?",
    correctAnswer: "His brother is James.",
    distractors: [
      "His brother is Toby.",
      "His brother is Rajiv.",
      "His brother is David."
    ]
  },
  {
    id: 27,
    question: "What is Mrs MacKenzie's favourite food?",
    correctAnswer: "She loves spaghetti bolognese.",
    distractors: [
      "She loves vegetarian pizza.",
      "She loves fish and chips.",
      "She loves chocolate cake."
    ]
  },
  {
    id: 28,
    question: "Who has piano lessons in Little Bridge?",
    correctAnswer: "David's sister Kate has piano lessons.",
    distractors: [
      "Rose's sister Lizzie has piano lessons.",
      "Rajiv's sister Geeta has piano lessons.",
      "Domino has piano lessons."
    ]
  },
  {
    id: 29,
    question: "What sport does Mrs MacKenzie enjoy at the weekend?",
    correctAnswer: "She enjoys a round of golf.",
    distractors: [
      "She enjoys swimming.",
      "She enjoys horse riding.",
      "She enjoys tennis."
    ]
  },
  {
    id: 30,
    question: "Who is Rose's grandpa?",
    correctAnswer: "Mr Miller is her grandpa.",
    distractors: [
      "Mr Kumar is her grandpa.",
      "Mr MacKenzie is her grandpa.",
      "Mr Williams is her grandpa."
    ]
  },
  {
    id: 31,
    question: "Where does Mr Miller live?",
    correctAnswer: "He lives in Little Bridge.",
    distractors: [
      "He lives in London.",
      "He lives in Big Town.",
      "She lives on a farm."
    ]
  },
  {
    id: 32,
    question: "Who is Mrs MacKenzie married to?",
    correctAnswer: "She is married to Mr MacKenzie.",
    distractors: [
      "She is married to Mr Kumar.",
      "She is married to Mr Miller.",
      "She is married to Mr Wood."
    ]
  },
  {
    id: 33,
    question: "What is Mr MacKenzie's name?",
    correctAnswer: "His first name is Tom.",
    distractors: [
      "His first name is Tim.",
      "His name is John.",
      "His first name is James."
    ]
  },
  {
    id: 34,
    question: "What is Mr MacKenzie's job?",
    correctAnswer: "He is a dentist.",
    distractors: [
      "He is a journalist.",
      "He is a teacher.",
      "He is an accountant."
    ]
  },
  {
    id: 35,
    question: "How many students are there in Mrs MacKenzie's class?",
    correctAnswer: "There are twenty-four students in her class.",
    distractors: [
      "There are twenty students in her class.",
      "There are thirty students in her class.",
      "There are fifteen students in her class."
    ]
  },
  {
    id: 36,
    question: "Who plays the guitar in Little Bridge?",
    correctAnswer: "Matthew plays the guitar.",
    distractors: [
      "David plays the guitar.",
      "Toby plays the guitar.",
      "James plays the guitar."
    ]
  },
  {
    id: 37,
    question: "How old is Rose?",
    correctAnswer: "She is nine years old.",
    distractors: [
      "She is ten years old.",
      "She is eight years old.",
      "She is twelve years old."
    ]
  },
  {
    id: 38,
    question: "How old is Lizzie?",
    correctAnswer: "She is twelve years old.",
    distractors: [
      "She is nine years old.",
      "She is eleven years old.",
      "She is fourteen years old."
    ]
  },
  {
    id: 39,
    question: "How old is Domino?",
    correctAnswer: "He is three years old.",
    distractors: [
      "He is ten years old.",
      "He is five years old.",
      "He is one year old."
    ]
  },
  {
    id: 40,
    question: "What is Rose's father surname?",
    correctAnswer: "Wood.",
    distractors: [
      "Kumar.",
      "Carter.",
      "Miller."
    ]
  },
  {
    id: 41,
    question: "What is the name of Rose's father?",
    correctAnswer: "Tim.",
    distractors: [
      "Tom.",
      "Toby.",
      "David.",
      "Sam.",
      "James."
    ]
  },
  {
    id: 42,
    question: "How old is Matthew?",
    correctAnswer: "He is eight years old.",
    distractors: [
      "He is nine years old.",
      "He is seven years old.",
      "He is ten years old."
    ]
  },
  {
    id: 43,
    question: "Does Toby have any brothers or sisters?",
    correctAnswer: "No he doesn't. He has got no brothers or sisters.",
    distractors: [
      "Yes, he has got one brother.",
      "Yes, he has got two sisters.",
      "Yes, he has got a brother and a sister.",
      "Yes, he does. Holly is his sister.",
      "Yes, he has got two brothers and two sisters."
    ]
  },
  {
    id: 44,
    question: "What does Mr Miller wear on his head?",
    correctAnswer: "He wears a hat.",
    distractors: [
      "He wears a scarf.",
      "He wears a helmet.",
      "He wears nothing."
    ]
  },
  {
    id: 45,
    question: "What colour is Mr Miller's moustache?",
    correctAnswer: "He has got a white moustache.",
    distractors: [
      "He has got a black moustache.",
      "He has got a brown moustache.",
      "He has got a grey moustache."
    ]
  },
  {
    id: 46,
    question: "How old is Rajiv?",
    correctAnswer: "He is seven years old.",
    distractors: [
      "He is five years old.",
      "He is ten years old.",
      "He is eight years old."
    ]
  },
  {
    id: 47,
    question: "Who are Rajiv's sisters?",
    correctAnswer: "His sisters are Geeta and Seema.",
    distractors: [
      "His sisters are Rose and Lizzie.",
      "His sisters are Kate and Grace.",
      "His sisters are Jenny and Kate."
    ]
  },
  {
    id: 48,
    question: "How old is Seema?",
    correctAnswer: "She is five years old.",
    distractors: [
      "She is seven years old.",
      "She is three years old.",
      "She is ten years old."
    ]
  },
  {
    id: 49,
    question: "Is Toby blonde?",
    correctAnswer: "No, he isn´t.",
    distractors: [
      "No, he has got black hair.",
      "Yes, he has got blonde hair.",
      "Yes, he is.",
      "No, his hair is brown.",
      "Yes, he is red-haired."
    ]
  },
  {
    id: 50,
    question: "How old is Holly?",
    correctAnswer: "She is eight years old.",
    distractors: [
      "She is nine years old.",
      "She is six years old.",
      "She is ten years old."
    ]
  }
];

// Consistent deterministic shuffling based on a seed or simply fixed order for the options per question,
// so that a user reloading or answering doesn't have options randomly changing their order mid-session.
// We will generate the questions with options shuffled once when the file is loaded.

function generateExtraDistractors(questionId: number, questionText: string, correctAnswer: string, distractors: string[]): string[] {
  if (questionId === 4) {
    return ["My Bridge.", "David."];
  }
  if (questionId === 31) {
    return ["She lives in a beautiful town.", "He lives on a boat."];
  }
  if (questionId === 10) {
    return [
      "Mrs MacKenzie has got two cats called Lenny and Lulu.",
      "Mrs Kumar has got two cats called Lenny and Lulu."
    ];
  }
  if (questionId === 2) {
    return ["There are eight shops.", "There are twelve shops."];
  }
  if (questionId === 28) {
    return [
      "Toby has piano lessons.",
      "David has piano lessons."
    ];
  }
  const currentOptions = new Set([correctAnswer.toLowerCase(), ...distractors.map(d => d.toLowerCase())]);
  const extra: string[] = [];

  // Helper to add if not already present
  function addOption(opt: string) {
    if (extra.length >= 2) return;
    if (!currentOptions.has(opt.toLowerCase())) {
      extra.push(opt);
      currentOptions.add(opt.toLowerCase());
    }
  }

  // 1. Age patterns: e.g. "She is thirty-six years old.", "He is eleven years old.", "He is seven years old."
  if (correctAnswer.toLowerCase().includes("years old") || correctAnswer.toLowerCase().includes("year old")) {
    const agePhrases = [
      "He is six years old.",
      "She is six years old.",
      "He is nine years old.",
      "She is nine years old.",
      "He is twelve years old.",
      "She is twelve years old.",
      "He is four years old.",
      "She is four years old.",
      "He is fifteen years old.",
      "She is fifteen years old.",
      "He is two years old.",
      "She is two years old.",
      "He is forty years old.",
      "She is forty years old.",
      "He is seven years old.",
      "She is seven years old.",
      "He is eleven years old.",
      "She is eleven years old."
    ];
    // Find matching gender
    const isShe = correctAnswer.toLowerCase().startsWith("she");
    const isHe = correctAnswer.toLowerCase().startsWith("he");
    
    for (const phrase of agePhrases) {
      if (isShe && phrase.startsWith("She")) addOption(phrase);
      else if (isHe && phrase.startsWith("He")) addOption(phrase);
      else addOption(phrase);
    }
  }

  // 2. Names patterns: "Her name is ...", "His name is ...", "His sisters are ...", "Mr Miller...", "Charlie..."
  if (questionText.toLowerCase().includes("name") || questionText.toLowerCase().includes("who is") || questionText.toLowerCase().includes("who has")) {
    const names = ["Toby", "David", "Rose", "Lizzie", "Jenny", "Grace", "Kate", "Rajiv", "Geeta", "Seema", "Matthew", "James", "Sam", "Charlie", "Domino"];
    if (correctAnswer.startsWith("Her name is")) {
      names.forEach(n => addOption(`Her name is ${n}.`));
    } else if (correctAnswer.startsWith("His name is") || correctAnswer.startsWith("His first name is")) {
      names.forEach(n => addOption(`His name is ${n}.`));
      names.forEach(n => addOption(`His first name is ${n}.`));
    } else if (correctAnswer.startsWith("Mr") || correctAnswer.endsWith("grandpa") || correctAnswer.includes("married to")) {
      const titles = [
        "Rose loves her grandpa.",
        "Mr Kumar is her grandpa.",
        "Mr Miller is her grandpa.",
        "She is married to Mr Wood.",
        "She is married to Mr Kumar.",
        "She is married to Mr Miller.",
        "Mr MacKenzie.",
        "Mr Wood."
      ];
      titles.forEach(t => addOption(t));
    } else {
      names.forEach(n => addOption(n));
      names.forEach(n => addOption(`${n} plays the guitar.`));
      names.forEach(n => addOption(`His brother is ${n}.`));
    }
  }

  // 3. Yes/No patterns: "Yes she does...", "No she doesn't.", "No, he isn't.", "Yes, he is."
  if (correctAnswer.toLowerCase().startsWith("yes") || correctAnswer.toLowerCase().startsWith("no")) {
    const yesNos = [
      "Yes, he does.",
      "No, he doesn't.",
      "Yes, she does.",
      "No, she doesn't.",
      "Yes, he is.",
      "No, he isn't.",
      "Yes, she is.",
      "No, she isn't.",
      "Yes, they do.",
      "No, they don't."
    ];
    yesNos.forEach(yn => addOption(yn));
  }

  // 4. Jobs: "He is a dentist.", "He is a journalist.", "She worked as..."
  if (correctAnswer.toLowerCase().includes("dentist") || correctAnswer.toLowerCase().includes("journalist") || correctAnswer.toLowerCase().includes("accountant") || correctAnswer.toLowerCase().includes("teacher")) {
    const jobs = [
      "He is a doctor.",
      "He is an engineer.",
      "She is a nurse.",
      "She is an artist.",
      "He is a firefighter.",
      "He is a lawyer.",
      "She worked as a doctor.",
      "She worked as a lawyer."
    ];
    const isWorked = correctAnswer.toLowerCase().includes("worked as");
    if (isWorked) {
      jobs.filter(j => j.includes("worked as")).forEach(j => addOption(j));
    }
    jobs.forEach(j => addOption(j));
  }

  // 5. Sports/Hobbies: "swimming", "golf", "guitar", "horse riding", "singing", "music"
  if (questionText.toLowerCase().includes("sport") || questionText.toLowerCase().includes("subject") || questionText.toLowerCase().includes("music") || questionText.toLowerCase().includes("pizza") || questionText.toLowerCase().includes("food") || questionText.toLowerCase().includes("love")) {
    const sports = ["tennis", "basketball", "running", "sailing", "cycling", "dancing"];
    const subjects = ["Art", "Music", "English", "Maths", "Science", "French"];
    const pizzas = ["margherita pizza", "mushroom pizza", "pineapple pizza", "seafood pizza"];
    const foods = ["fish and chips", "pizza", "burger and fries", "roast chicken", "ice cream"];
    
    if (questionText.toLowerCase().includes("sport")) {
      sports.forEach(s => addOption(`Her favourite sport is ${s}.`));
      sports.forEach(s => addOption(`She enjoys ${s}.`));
    } else if (questionText.toLowerCase().includes("subject")) {
      subjects.forEach(s => addOption(`Her favourite subject is ${s}.`));
    } else if (questionText.toLowerCase().includes("pizza")) {
      pizzas.forEach(p => addOption(`She loves ${p}.`));
    } else if (questionText.toLowerCase().includes("food")) {
      foods.forEach(f => addOption(`She loves ${f}.`));
    }
  }

  // 6. Colors: "black and white", "brown dog", "white moustache"
  if (correctAnswer.toLowerCase().includes("white") || correctAnswer.toLowerCase().includes("black") || correctAnswer.toLowerCase().includes("brown") || correctAnswer.toLowerCase().includes("grey")) {
    const colors = [
      "He is completely grey.",
      "He is red and white.",
      "He is a lovely black dog.",
      "He is a golden dog.",
      "He has got a red moustache.",
      "He has got a blonde moustache."
    ];
    colors.forEach(c => addOption(c));
  }

  // 7. Fallback list of generic but grammatical English answers:
  const genericFallbacks = [
    "She lives in a beautiful town.",
    "He has got a lovely house.",
    "There are eight shops.",
    "Yes, she has got a dog.",
    "No, they aren't here.",
    "He likes reading comics.",
    "She is nine years old.",
    "They love chocolate cake.",
    "Mr and Mrs Wood.",
    "David plays the guitar."
  ];

  for (const fallback of genericFallbacks) {
    addOption(fallback);
  }

  // Ensure we have exactly 2 elements
  while (extra.length < 2) {
    extra.push(`Option ${extra.length + 5} for Question ${questionId}`);
  }

  return extra;
}

export const questions: Question[] = rawQuestions.map((q) => {
  // Generate extra distractors dynamically to have 5 distractors total (6 options).
  // Questions 18, 41, 43 and 49 already have exactly 5 distractors, so we don't need to generate extra.
  const extraDistractors = (q.id === 18 || q.id === 41 || q.id === 43 || q.id === 49) ? [] : generateExtraDistractors(q.id, q.question, q.correctAnswer, q.distractors);
  const allDistractors = [...q.distractors, ...extraDistractors];
  const options = [q.correctAnswer, ...allDistractors];
  
  // Format each option to ensure it ends with a dot
  const formattedOptions = options.map(opt => {
    let trimmed = opt.trim();
    if (trimmed && !trimmed.endsWith(".") && !trimmed.endsWith("?") && !trimmed.endsWith("!")) {
      trimmed += ".";
    }
    return trimmed;
  });

  // Make sure correctAnswer also has a dot
  let formattedCorrectAnswer = q.correctAnswer.trim();
  if (formattedCorrectAnswer && !formattedCorrectAnswer.endsWith(".") && !formattedCorrectAnswer.endsWith("?") && !formattedCorrectAnswer.endsWith("!")) {
    formattedCorrectAnswer += ".";
  }
  
  // Deterministic shuffle based on question ID so that options remain stable on refresh
  // Simple LCG pseudo-random sorting
  let seed = q.id + 1337;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const shuffledOptions = [...formattedOptions].map(opt => ({ opt, rand: pseudoRandom() }))
    .sort((a, b) => a.rand - b.rand)
    .map(x => x.opt);

  return {
    id: q.id,
    question: q.question,
    correctAnswer: formattedCorrectAnswer,
    options: shuffledOptions,
  };
});
