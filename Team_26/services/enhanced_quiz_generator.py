import json
import sys
import os
import re
import random
from typing import List, Dict, Any

class MLQuestionEnhancer:
    def __init__(self):
        # Educational quality metrics
        self.bloom_taxonomy = {
            'remember': ['define', 'list', 'identify', 'name', 'recall', 'recognize'],
            'understand': ['explain', 'describe', 'summarize', 'interpret', 'classify'],
            'apply': ['use', 'demonstrate', 'solve', 'implement', 'execute'],
            'analyze': ['compare', 'contrast', 'examine', 'investigate', 'analyze'],
            'evaluate': ['judge', 'critique', 'assess', 'evaluate', 'justify'],
            'create': ['design', 'create', 'construct', 'develop', 'formulate']
        }
        
        # High-quality question database
        self.question_database = {
            'Artificial Intelligence': {
                'easy': [
                    {
                        'question': 'What is the primary goal of machine learning in artificial intelligence?',
                        'options': [
                            'To enable computers to learn from data without explicit programming',
                            'To replace human intelligence completely',
                            'To make computers faster than humans',
                            'To eliminate the need for data'
                        ],
                        'correctAnswer': 'To enable computers to learn from data without explicit programming',
                        'explanation': 'Machine learning aims to create systems that can learn and improve from experience without being explicitly programmed for every task.'
                    },
                    {
                        'question': 'What is the difference between artificial intelligence and machine learning?',
                        'options': [
                            'AI is the broader concept, ML is a subset of AI that focuses on learning from data',
                            'ML is broader than AI and includes all computer intelligence',
                            'AI and ML are exactly the same thing',
                            'AI only works with text, ML only works with images'
                        ],
                        'correctAnswer': 'AI is the broader concept, ML is a subset of AI that focuses on learning from data',
                        'explanation': 'Artificial Intelligence is the broad field of creating intelligent machines, while Machine Learning is a specific approach within AI that enables computers to learn from data.'
                    },
                    {
                        'question': 'Which algorithm is most commonly used for classification in machine learning?',
                        'options': [
                            'Support Vector Machine (SVM)',
                            'Bubble Sort',
                            'Binary Search',
                            'Quick Sort'
                        ],
                        'correctAnswer': 'Support Vector Machine (SVM)',
                        'explanation': 'SVM is a powerful supervised learning algorithm used for classification and regression tasks.'
                    },
                    {
                        'question': 'What does AI stand for?',
                        'options': [
                            'Artificial Intelligence',
                            'Automated Information',
                            'Advanced Integration',
                            'Algorithmic Intelligence'
                        ],
                        'correctAnswer': 'Artificial Intelligence',
                        'explanation': 'AI stands for Artificial Intelligence, which refers to the simulation of human intelligence in machines.'
                    }
                ],
                'medium': [
                    {
                        'question': 'How does supervised learning differ from unsupervised learning?',
                        'options': [
                            'Supervised learning uses labeled data, unsupervised learning finds patterns in unlabeled data',
                            'Supervised learning is faster than unsupervised learning',
                            'Supervised learning requires more computational power',
                            'There is no difference between them'
                        ],
                        'correctAnswer': 'Supervised learning uses labeled data, unsupervised learning finds patterns in unlabeled data',
                        'explanation': 'Supervised learning learns from labeled examples, while unsupervised learning discovers hidden patterns in data without labels.'
                    },
                    {
                        'question': 'What is the purpose of cross-validation in machine learning?',
                        'options': [
                            'To evaluate model performance on unseen data and prevent overfitting',
                            'To make the model train faster',
                            'To reduce the size of the dataset',
                            'To increase the accuracy of the model'
                        ],
                        'correctAnswer': 'To evaluate model performance on unseen data and prevent overfitting',
                        'explanation': 'Cross-validation helps assess how well a model will generalize to new data by testing it on different subsets of the training data.'
                    },
                    {
                        'question': 'What is the role of activation functions in neural networks?',
                        'options': [
                            'To introduce non-linearity and enable the network to learn complex patterns',
                            'To make the network faster',
                            'To reduce memory usage',
                            'To connect different layers'
                        ],
                        'correctAnswer': 'To introduce non-linearity and enable the network to learn complex patterns',
                        'explanation': 'Activation functions introduce non-linearity into the network, allowing it to learn complex, non-linear relationships in the data.'
                    },
                    {
                        'question': 'What is the purpose of feature selection in machine learning?',
                        'options': [
                            'To reduce dimensionality and improve model performance',
                            'To increase the number of data points',
                            'To make the algorithm run faster',
                            'To reduce computational complexity'
                        ],
                        'correctAnswer': 'To reduce dimensionality and improve model performance',
                        'explanation': 'Feature selection helps remove irrelevant or redundant features, improving model performance and reducing overfitting.'
                    },
                    {
                        'question': 'Which neural network architecture is best for image recognition?',
                        'options': [
                            'Convolutional Neural Network (CNN)',
                            'Recurrent Neural Network (RNN)',
                            'Feedforward Neural Network',
                            'Radial Basis Function Network'
                        ],
                        'correctAnswer': 'Convolutional Neural Network (CNN)',
                        'explanation': 'CNNs are specifically designed for image processing and recognition tasks due to their ability to detect spatial patterns.'
                    },
                    {
                        'question': 'How does overfitting affect model performance?',
                        'options': [
                            'It causes the model to perform well on training data but poorly on new data',
                            'It improves model performance on both training and test data',
                            'It has no effect on model performance',
                            'It only affects the training time'
                        ],
                        'correctAnswer': 'It causes the model to perform well on training data but poorly on new data',
                        'explanation': 'Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new data.'
                    }
                ],
                'hard': [
                    {
                        'question': 'What is the mathematical principle behind gradient descent optimization?',
                        'options': [
                            'It iteratively adjusts parameters in the direction of steepest descent of the cost function',
                            'It randomly searches for the optimal solution',
                            'It uses linear algebra to solve equations directly',
                            'It applies statistical sampling methods'
                        ],
                        'correctAnswer': 'It iteratively adjusts parameters in the direction of steepest descent of the cost function',
                        'explanation': 'Gradient descent minimizes the cost function by moving in the direction opposite to the gradient, which points to the steepest ascent.'
                    },
                    {
                        'question': 'How would you implement a custom loss function for imbalanced datasets?',
                        'options': [
                            'By applying class weights inversely proportional to class frequencies',
                            'By using the same loss function for all classes',
                            'By removing samples from the majority class',
                            'By increasing the learning rate'
                        ],
                        'correctAnswer': 'By applying class weights inversely proportional to class frequencies',
                        'explanation': 'Class weighting helps balance the contribution of each class to the loss function, giving more importance to minority classes.'
                    }
                ]
            },
            'Data Structures': {
                'easy': [
                    {
                        'question': 'What is a linked list?',
                        'options': [
                            'A linear data structure where elements are stored in nodes with pointers',
                            'A circular data structure',
                            'A tree-like structure',
                            'A hash-based structure'
                        ],
                        'correctAnswer': 'A linear data structure where elements are stored in nodes with pointers',
                        'explanation': 'A linked list is a linear data structure where each element (node) contains data and a pointer to the next node.'
                    },
                    {
                        'question': 'Which data structure follows LIFO principle?',
                        'options': [
                            'Stack',
                            'Queue',
                            'Array',
                            'Tree'
                        ],
                        'correctAnswer': 'Stack',
                        'explanation': 'Stack follows Last In, First Out (LIFO) principle, where the last element added is the first one to be removed.'
                    },
                    {
                        'question': 'What is the time complexity of array access?',
                        'options': [
                            'O(1)',
                            'O(n)',
                            'O(log n)',
                            'O(n²)'
                        ],
                        'correctAnswer': 'O(1)',
                        'explanation': 'Array access is O(1) because elements are stored in contiguous memory and can be accessed directly using an index.'
                    }
                ],
                'medium': [
                    {
                        'question': 'What is the time complexity of inserting an element in a binary search tree?',
                        'options': [
                            'O(log n)',
                            'O(n)',
                            'O(1)',
                            'O(n²)'
                        ],
                        'correctAnswer': 'O(log n)',
                        'explanation': 'In a balanced BST, insertion takes O(log n) time as we traverse down the tree to find the correct position.'
                    },
                    {
                        'question': 'Which data structure is best for implementing a queue?',
                        'options': [
                            'Linked List',
                            'Array',
                            'Stack',
                            'Tree'
                        ],
                        'correctAnswer': 'Linked List',
                        'explanation': 'Linked list is ideal for queue implementation as it allows efficient insertion at one end and deletion at the other end.'
                    },
                    {
                        'question': 'What is the main advantage of using a hash table?',
                        'options': [
                            'Average O(1) time complexity for search, insert, and delete',
                            'Guaranteed sorted order',
                            'Memory efficiency',
                            'Easy to implement'
                        ],
                        'correctAnswer': 'Average O(1) time complexity for search, insert, and delete',
                        'explanation': 'Hash tables provide average O(1) time complexity for basic operations, making them very efficient for lookups.'
                    }
                ]
            },
            'Computer Networks': {
                'easy': [
                    {
                        'question': 'What is the purpose of the OSI model in computer networking?',
                        'options': [
                            'To standardize network communication protocols',
                            'To increase network speed',
                            'To reduce network costs',
                            'To simplify network hardware'
                        ],
                        'correctAnswer': 'To standardize network communication protocols',
                        'explanation': 'The OSI model provides a standardized framework for understanding and implementing network protocols across different systems.'
                    },
                    {
                        'question': 'Which protocol is used for reliable data transmission over the internet?',
                        'options': [
                            'TCP (Transmission Control Protocol)',
                            'UDP (User Datagram Protocol)',
                            'HTTP (Hypertext Transfer Protocol)',
                            'FTP (File Transfer Protocol)'
                        ],
                        'correctAnswer': 'TCP (Transmission Control Protocol)',
                        'explanation': 'TCP provides reliable, ordered, and error-checked delivery of data between applications running on hosts.'
                    }
                ],
                'medium': [
                    {
                        'question': 'What is the difference between TCP and UDP?',
                        'options': [
                            'TCP is connection-oriented and reliable, UDP is connectionless and unreliable',
                            'TCP is faster than UDP',
                            'UDP is more secure than TCP',
                            'There is no difference between them'
                        ],
                        'correctAnswer': 'TCP is connection-oriented and reliable, UDP is connectionless and unreliable',
                        'explanation': 'TCP establishes a connection and ensures reliable delivery, while UDP sends data without establishing a connection or guaranteeing delivery.'
                    },
                    {
                        'question': 'What is the purpose of DNS in computer networks?',
                        'options': [
                            'To translate domain names to IP addresses',
                            'To encrypt network traffic',
                            'To compress data transmission',
                            'To manage network security'
                        ],
                        'correctAnswer': 'To translate domain names to IP addresses',
                        'explanation': 'DNS (Domain Name System) translates human-readable domain names into IP addresses that computers use to identify each other.'
                    }
                ]
            },
            'Cybersecurity': {
                'easy': [
                    {
                        'question': 'What is the primary purpose of encryption in cybersecurity?',
                        'options': [
                            'To protect data confidentiality and integrity',
                            'To increase data transmission speed',
                            'To reduce storage requirements',
                            'To simplify data processing'
                        ],
                        'correctAnswer': 'To protect data confidentiality and integrity',
                        'explanation': 'Encryption ensures that data remains confidential and maintains its integrity by making it unreadable to unauthorized parties.'
                    },
                    {
                        'question': 'Which type of attack involves flooding a network with traffic?',
                        'options': [
                            'DDoS (Distributed Denial of Service)',
                            'Phishing',
                            'SQL Injection',
                            'Man-in-the-middle attack'
                        ],
                        'correctAnswer': 'DDoS (Distributed Denial of Service)',
                        'explanation': 'DDoS attacks overwhelm a target system with traffic from multiple sources, making it unavailable to legitimate users.'
                    }
                ],
                'medium': [
                    {
                        'question': 'What is the difference between symmetric and asymmetric encryption?',
                        'options': [
                            'Symmetric uses the same key for encryption and decryption, asymmetric uses different keys',
                            'Symmetric is faster than asymmetric',
                            'Asymmetric is more secure than symmetric',
                            'There is no difference between them'
                        ],
                        'correctAnswer': 'Symmetric uses the same key for encryption and decryption, asymmetric uses different keys',
                        'explanation': 'Symmetric encryption uses one key for both operations, while asymmetric encryption uses a public key for encryption and a private key for decryption.'
                    },
                    {
                        'question': 'What is the purpose of a firewall in network security?',
                        'options': [
                            'To monitor and control incoming and outgoing network traffic',
                            'To encrypt data transmission',
                            'To compress network data',
                            'To increase network speed'
                        ],
                        'correctAnswer': 'To monitor and control incoming and outgoing network traffic',
                        'explanation': 'A firewall acts as a barrier between trusted and untrusted networks, filtering traffic based on security rules.'
                    }
                ]
            }
        }

    def generate_questions(self, topics: List[str], difficulty: str = 'medium', question_count: int = 10) -> List[Dict]:
        """Generate high-quality questions for given topics"""
        all_questions = []
        
        for topic in topics:
            topic_questions = self.question_database.get(topic, self.question_database['Artificial Intelligence'])
            difficulty_questions = topic_questions.get(difficulty, topic_questions['medium'])
            
            # Select random questions from the database
            selected_questions = random.sample(difficulty_questions, min(question_count, len(difficulty_questions)))
            
            for question in selected_questions:
                enhanced_question = {
                    'question': question['question'],
                    'options': question['options'],
                    'correctAnswer': question['correctAnswer'],
                    'difficulty': difficulty,
                    'topic': topic,
                    'subtopic': topic,
                    'skill': self._classify_bloom_level(question['question']),
                    'source': 'ml_enhanced',
                    'quality_score': self._calculate_quality_score(question, difficulty),
                    'explanation': question['explanation']
                }
                all_questions.append(enhanced_question)
        
        return all_questions

    def _classify_bloom_level(self, question: str) -> str:
        """Classify question according to Bloom's taxonomy"""
        question_lower = question.lower()
        
        for level, keywords in self.bloom_taxonomy.items():
            for keyword in keywords:
                if keyword in question_lower:
                    return level
        
        return 'understand'  # Default level

    def _calculate_quality_score(self, question: Dict, difficulty: str) -> float:
        """Calculate quality score based on educational value"""
        base_scores = {'easy': 0.7, 'medium': 0.8, 'hard': 0.9}
        base_score = base_scores.get(difficulty, 0.8)
        
        # Add bonus for good explanation
        explanation_bonus = 0.1 if question.get('explanation') else 0
        
        # Add bonus for multiple plausible options
        options_bonus = 0.1 if len(question['options']) >= 4 else 0
        
        return min(base_score + explanation_bonus + options_bonus, 1.0)

def main():
    if len(sys.argv) != 2:
        print("Usage: python enhanced_quiz_generator.py <input_file>", file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            input_data = json.load(f)
        
        topics = input_data.get('topics', ['Artificial Intelligence'])
        difficulty = input_data.get('difficulty', 'medium')
        question_count = input_data.get('question_count', 10)
        
        enhancer = MLQuestionEnhancer()
        questions = enhancer.generate_questions(topics, difficulty, question_count)
        
        # Output as JSON
        print(json.dumps(questions, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()