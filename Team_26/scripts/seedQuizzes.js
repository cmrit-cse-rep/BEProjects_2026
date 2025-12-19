const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
require('dotenv').config();

const quizData = [
    {
  "subject": "Data Structures",
  "title": "Fundamentals of Data Structures",
  "description": "Explore the core concepts of data structures including arrays, linked lists, stacks, queues, trees, and graphs.",
  "questions": [
    {
      "question": "What is the time complexity of accessing an element in an array by index?",
      "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      "correctAnswer": "O(1)",
      "difficulty": "easy",
      "topic": "Arrays"
    },
    {
      "question": "Which data structure uses nodes and pointers?",
      "options": ["Array", "Linked List", "Stack", "Queue"],
      "correctAnswer": "Linked List",
      "difficulty": "easy",
      "topic": "Linked Lists"
    },
    {
      "question": "What is the worst-case time complexity for searching an element in a singly linked list?",
      "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      "correctAnswer": "O(n)",
      "difficulty": "medium",
      "topic": "Linked Lists"
    },
    {
      "question": "Which data structure is best suited for implementing recursion?",
      "options": ["Queue", "Stack", "Linked List", "Heap"],
      "correctAnswer": "Stack",
      "difficulty": "easy",
      "topic": "Stacks"
    },
    {
      "question": "What is the space complexity of a linked list storing n elements?",
      "options": ["O(n)", "O(1)", "O(log n)", "O(n^2)"],
      "correctAnswer": "O(n)",
      "difficulty": "medium",
      "topic": "Linked Lists"
    },
    {
      "question": "Which data structure allows insertion and deletion from both ends?",
      "options": ["Stack", "Queue", "Deque", "Tree"],
      "correctAnswer": "Deque",
      "difficulty": "medium",
      "topic": "Deque"
    },
    {
      "question": "What is the time complexity of inserting an element at the beginning of a singly linked list?",
      "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      "correctAnswer": "O(1)",
      "difficulty": "easy",
      "topic": "Linked Lists"
    },
    {
      "question": "Which data structure is used to implement priority queues?",
      "options": ["Heap", "Queue", "Stack", "Linked List"],
      "correctAnswer": "Heap",
      "difficulty": "medium",
      "topic": "Heaps"
    },
    {
      "question": "Which of the following is a self-balancing binary search tree?",
      "options": ["AVL Tree", "Binary Heap", "Trie", "B-Tree"],
      "correctAnswer": "AVL Tree",
      "difficulty": "hard",
      "topic": "Trees"
    },
    {
      "question": "Which data structure is used in breadth-first search (BFS) of a graph?",
      "options": ["Stack", "Queue", "Priority Queue", "Heap"],
      "correctAnswer": "Queue",
      "difficulty": "medium",
      "topic": "Graphs"
    },
    {
      "question": "What is the main advantage of a linked list over an array?",
      "options": ["Faster access time", "Dynamic size", "Simpler implementation", "Better cache performance"],
      "correctAnswer": "Dynamic size",
      "difficulty": "easy",
      "topic": "Linked Lists"
    },
    {
      "question": "In a binary search tree, what is the time complexity of searching for an element in the average case?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      "correctAnswer": "O(log n)",
      "difficulty": "medium",
      "topic": "Trees"
    },
    {
      "question": "Which data structure is used for implementing LRU cache?",
      "options": ["Stack", "Queue", "HashMap with Doubly Linked List", "Heap"],
      "correctAnswer": "HashMap with Doubly Linked List",
      "difficulty": "hard",
      "topic": "Caching"
    },
    {
      "question": "What is the height of a complete binary tree with n nodes?",
      "options": ["log n", "n", "n log n", "1"],
      "correctAnswer": "log n",
      "difficulty": "medium",
      "topic": "Trees"
    },
    {
      "question": "Which data structure is used in depth-first search (DFS) of a graph?",
      "options": ["Queue", "Stack", "Heap", "Priority Queue"],
      "correctAnswer": "Stack",
      "difficulty": "medium",
      "topic": "Graphs"
    },
    {
      "question": "What is the time complexity of inserting an element into a heap?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      "correctAnswer": "O(log n)",
      "difficulty": "medium",
      "topic": "Heaps"
    },
    {
      "question": "Which data structure is used to implement a circular buffer?",
      "options": ["Stack", "Queue", "Array", "Deque"],
      "correctAnswer": "Array",
      "difficulty": "medium",
      "topic": "Arrays"
    },
    {
      "question": "What is the maximum number of nodes in a binary tree of height h?",
      "options": ["2^h - 1", "2h - 1", "h^2", "h"],
      "correctAnswer": "2^h - 1",
      "difficulty": "medium",
      "topic": "Trees"
    },
    {
      "question": "Which data structure is used for implementing undo operations in text editors?",
      "options": ["Queue", "Stack", "Heap", "Linked List"],
      "correctAnswer": "Stack",
      "difficulty": "easy",
      "topic": "Stacks"
    },
    {
      "question": "What is the time complexity of searching for an element in a hash table?",
      "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      "correctAnswer": "O(1)",
      "difficulty": "easy",
      "topic": "Hashing"
    }
  ]
},

   {
    "subject": "Algorithms",
    "title": "Sorting and Searching",
    "description": "Basic sorting and searching algorithms and their complexities",
    "questions": [
      {
        "question": "Which sorting algorithm is the fastest on average for large datasets?",
        "options": ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"],
        "correctAnswer": "Quick Sort",
        "difficulty": "medium",
        "topic": "Sorting"
      },
      {
        "question": "What is the worst-case time complexity of Quick Sort?",
        "options": ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
        "correctAnswer": "O(n^2)",
        "difficulty": "medium",
        "topic": "Sorting"
      },
      {
        "question": "Which sorting algorithm is stable?",
        "options": ["Heap Sort", "Merge Sort", "Quick Sort", "Selection Sort"],
        "correctAnswer": "Merge Sort",
        "difficulty": "easy",
        "topic": "Sorting"
      },
      {
        "question": "Which search algorithm works on sorted arrays and has O(log n) complexity?",
        "options": ["Linear Search", "Binary Search", "Jump Search", "Exponential Search"],
        "correctAnswer": "Binary Search",
        "difficulty": "easy",
        "topic": "Searching"
      },
      {
        "question": "Which algorithm is used to find the shortest path in a graph with non-negative weights?",
        "options": ["Dijkstra's Algorithm", "Bellman-Ford Algorithm", "DFS", "BFS"],
        "correctAnswer": "Dijkstra's Algorithm",
        "difficulty": "medium",
        "topic": "Graphs"
      },
      {
        "question": "What is the time complexity of merge sort?",
        "options": ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
        "correctAnswer": "O(n log n)",
        "difficulty": "medium",
        "topic": "Sorting"
      },
      {
        "question": "Which algorithm is based on the divide and conquer approach?",
        "options": ["Bubble Sort", "Quick Sort", "Insertion Sort", "Selection Sort"],
        "correctAnswer": "Quick Sort",
        "difficulty": "easy",
        "topic": "Sorting"
      },
      {
        "question": "Which algorithm finds strongly connected components in a directed graph?",
        "options": ["Kruskal's Algorithm", "Kosaraju's Algorithm", "Prim's Algorithm", "Dijkstra's Algorithm"],
        "correctAnswer": "Kosaraju's Algorithm",
        "difficulty": "hard",
        "topic": "Graphs"
      },
      {
        "question": "What is the average time complexity of linear search?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        "correctAnswer": "O(n)",
        "difficulty": "easy",
        "topic": "Searching"
      },
      {
        "question": "Which algorithm can be used for finding the minimum spanning tree?",
        "options": ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Bellman-Ford Algorithm", "Floyd Warshall Algorithm"],
        "correctAnswer": "Kruskal's Algorithm",
        "difficulty": "medium",
        "topic": "Graphs"
      }
    ]
  },
    {
    "subject": "Operating Systems",
    "title": "Process Management and Scheduling",
    "description": "Concepts of processes and CPU scheduling algorithms",
    "questions": [
      {
        "question": "What is a process in an operating system?",
        "options": ["A program in execution", "A file", "A hardware component", "Memory segment"],
        "correctAnswer": "A program in execution",
        "difficulty": "easy",
        "topic": "Processes"
      },
      {
        "question": "Which scheduling algorithm can cause starvation?",
        "options": ["Round Robin", "First-Come First-Serve", "Priority Scheduling", "Shortest Job First"],
        "correctAnswer": "Priority Scheduling",
        "difficulty": "medium",
        "topic": "Scheduling"
      },
      {
        "question": "What is the function of the OS scheduler?",
        "options": ["Manage hardware devices", "Allocate memory", "Decide which process runs next", "Manage files"],
        "correctAnswer": "Decide which process runs next",
        "difficulty": "easy",
        "topic": "Scheduling"
      },
      {
        "question": "What is a deadlock?",
        "options": ["A state where two or more processes are blocked forever", "A resource that is always free", "A process that runs infinitely", "A hardware failure"],
        "correctAnswer": "A state where two or more processes are blocked forever",
        "difficulty": "medium",
        "topic": "Processes"
      },
      {
        "question": "Which algorithm assigns a fixed time slice to each process in a cyclic order?",
        "options": ["FCFS", "Round Robin", "Priority Scheduling", "SJF"],
        "correctAnswer": "Round Robin",
        "difficulty": "easy",
        "topic": "Scheduling"
      },
      {
        "question": "What does a context switch involve?",
        "options": ["Switching from user mode to kernel mode", "Switching from one process to another", "Switching memory segments", "Switching hardware devices"],
        "correctAnswer": "Switching from one process to another",
        "difficulty": "medium",
        "topic": "Processes"
      },
      {
        "question": "Which of the following is not a CPU scheduling algorithm?",
        "options": ["FCFS", "SJF", "FIFO", "Round Robin"],
        "correctAnswer": "FIFO",
        "difficulty": "easy",
        "topic": "Scheduling"
      },
      {
        "question": "What is virtual memory?",
        "options": ["Physical memory", "Disk space used as RAM", "Cache memory", "Register memory"],
        "correctAnswer": "Disk space used as RAM",
        "difficulty": "medium",
        "topic": "Memory Management"
      },
      {
        "question": "Which condition is necessary for deadlock?",
        "options": ["Mutual Exclusion", "Hold and Wait", "No Preemption", "All of the above"],
        "correctAnswer": "All of the above",
        "difficulty": "hard",
        "topic": "Deadlocks"
      },
      {
        "question": "Which scheduling algorithm is preemptive and selects the process with the shortest remaining time?",
        "options": ["SJF (non-preemptive)", "SRTF", "Round Robin", "Priority Scheduling"],
        "correctAnswer": "SRTF",
        "difficulty": "hard",
        "topic": "Scheduling"
      }
    ]
  },
    {
    "subject": "Computer Networks",
    "title": "Networking Fundamentals",
    "description": "Basic concepts of computer networking and protocols",
    "questions": [
      {
        "question": "What does IP stand for in networking?",
        "options": ["Internet Protocol", "Internal Process", "Internet Program", "Integrated Port"],
        "correctAnswer": "Internet Protocol",
        "difficulty": "easy",
        "topic": "Networking Basics"
      },
      {
        "question": "Which layer of the OSI model is responsible for routing?",
        "options": ["Physical", "Data Link", "Network", "Transport"],
        "correctAnswer": "Network",
        "difficulty": "medium",
        "topic": "OSI Model"
      },
      {
        "question": "Which protocol is used to transfer web pages?",
        "options": ["FTP", "HTTP", "SMTP", "DNS"],
        "correctAnswer": "HTTP",
        "difficulty": "easy",
        "topic": "Protocols"
      },
      {
        "question": "What is the main purpose of the Transport layer?",
        "options": ["Data formatting", "Routing", "Reliable data transfer", "Physical transmission"],
        "correctAnswer": "Reliable data transfer",
        "difficulty": "medium",
        "topic": "OSI Model"
      },
      {
        "question": "What does DNS stand for?",
        "options": ["Domain Name System", "Digital Network Service", "Data Name Service", "Domain Number System"],
        "correctAnswer": "Domain Name System",
        "difficulty": "easy",
        "topic": "Protocols"
      },
      {
        "question": "Which device connects multiple networks together?",
        "options": ["Switch", "Router", "Hub", "Bridge"],
        "correctAnswer": "Router",
        "difficulty": "medium",
        "topic": "Networking Devices"
      },
      {
        "question": "Which protocol is connection-oriented?",
        "options": ["UDP", "TCP", "IP", "ICMP"],
        "correctAnswer": "TCP",
        "difficulty": "medium",
        "topic": "Protocols"
      },
      {
        "question": "What is a MAC address?",
        "options": ["IP address", "Physical address of a network device", "Port number", "Protocol identifier"],
        "correctAnswer": "Physical address of a network device",
        "difficulty": "easy",
        "topic": "Networking Basics"
      },
      {
        "question": "Which protocol is used for sending emails?",
        "options": ["SMTP", "FTP", "HTTP", "DNS"],
        "correctAnswer": "SMTP",
        "difficulty": "easy",
        "topic": "Protocols"
      },
      {
        "question": "What is the range of private IP addresses in IPv4?",
        "options": [
          "192.168.0.0 to 192.168.255.255",
          "172.16.0.0 to 172.31.255.255",
          "10.0.0.0 to 10.255.255.255",
          "All of the above"
        ],
        "correctAnswer": "All of the above",
        "difficulty": "medium",
        "topic": "Networking Basics"
      }
    ]
  },
    {
        subject: 'DBMS',
        title: 'Database Fundamentals',
        description: 'Basics of databases and SQL',
        questions: [
            {
                question: 'Which command is used to retrieve data from a database?',
                options: ['INSERT', 'SELECT', 'UPDATE', 'DELETE'],
                correctAnswer: 'SELECT',
                difficulty: 'easy',
                topic: 'SQL'
            },
            {
                question: 'What is a primary key in a database?',
                options: ['A unique identifier for a record', 'A foreign key', 'A data type', 'An index'],
                correctAnswer: 'A unique identifier for a record',
                difficulty: 'easy',
                topic: 'Keys'
            }
            
        ]
    },
    {
        subject: 'Machine Learning',
        title: 'Introduction to Machine Learning',
        description: 'Basic concepts and types of machine learning',
        questions: [
            {
                question: 'Which of the following is a type of supervised learning?',
                options: ['Clustering', 'Classification', 'Association', 'Dimensionality Reduction'],
                correctAnswer: 'Classification',
                difficulty: 'easy',
                topic: 'Learning Types'
            },
            {
                question: 'What is overfitting in machine learning?',
                options: ['Model performs well on training but poorly on test data', 'Model performs poorly on both training and test data', 'Model performs well on test data only', 'Model uses too few features'],
                correctAnswer: 'Model performs well on training but poorly on test data',
                difficulty: 'medium',
                topic: 'Model Evaluation'
            }
        ]
    },
    {
        subject: 'Artificial Intelligence',
        title: 'AI Concepts',
        description: 'Introduction to artificial intelligence',
        questions: [
            {
                question: 'What is the goal of Artificial Intelligence?',
                options: ['To automate tasks', 'To create human-like intelligence', 'To store data', 'To design hardware'],
                correctAnswer: 'To create human-like intelligence',
                difficulty: 'easy',
                topic: 'Goals'
            },
            {
                question: 'Which AI technique is inspired by the human brain?',
                options: ['Decision Trees', 'Neural Networks', 'Genetic Algorithms', 'Bayesian Networks'],
                correctAnswer: 'Neural Networks',
                difficulty: 'medium',
                topic: 'Techniques'
            }
        ]
    },
    {
        subject: 'Cybersecurity',
        title: 'Basics of Cybersecurity',
        description: 'Fundamentals of protecting computer systems',
        questions: [
            {
                question: 'What does VPN stand for?',
                options: ['Virtual Private Network', 'Variable Protocol Network', 'Virtual Public Network', 'Verified Private Network'],
                correctAnswer: 'Virtual Private Network',
                difficulty: 'easy',
                topic: 'Networking'
            },
            {
                question: 'Which of the following is a type of malware?',
                options: ['Firewall', 'Trojan Horse', 'Antivirus', 'Encryption'],
                correctAnswer: 'Trojan Horse',
                difficulty: 'easy',
                topic: 'Malware'
            }
        ]
    },
    {
        subject: 'Web Development',
        title: 'Frontend Basics',
        description: 'Introduction to web development technologies',
        questions: [
            {
                question: 'Which language is primarily used for styling web pages?',
                options: ['HTML', 'CSS', 'JavaScript', 'Python'],
                correctAnswer: 'CSS',
                difficulty: 'easy',
                topic: 'CSS'
            },
            {
                question: 'What does HTML stand for?',
                options: ['Hyper Text Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'Hyper Tool Multi Language'],
                correctAnswer: 'Hyper Text Markup Language',
                difficulty: 'easy',
                topic: 'HTML'
            }
        ]
    },
    {
        subject: 'Cloud Computing',
        title: 'Cloud Basics',
        description: 'Introduction to cloud computing concepts',
        questions: [
            {
                question: 'Which of these is a cloud service provider?',
                options: ['AWS', 'Oracle', 'Linux', 'Microsoft Word'],
                correctAnswer: 'AWS',
                difficulty: 'easy',
                topic: 'Providers'
            },
            {
                question: 'What does SaaS stand for?',
                options: ['Software as a Service', 'Security as a Service', 'Storage as a Service', 'System as a Service'],
                correctAnswer: 'Software as a Service',
                difficulty: 'medium',
                topic: 'Cloud Models'
            }
        ]
    }
];

async function seedQuizzes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing quizzes
        await Quiz.deleteMany({});
        console.log('Cleared existing quizzes');

        // Insert new quizzes
        await Quiz.insertMany(quizData);
        console.log('Successfully seeded quiz data');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error seeding quizzes:', error);
        process.exit(1);
    }
}

seedQuizzes();
