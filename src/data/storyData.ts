export const storyContent = [
  {
    text: "Once upon a time in the magical forest of Whisperwood, there lived a little rabbit named Hoppy. Hoppy loved to explore and make new friends.",
    image: "https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
    background: "https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "What is the name of the little rabbit?",
        options: [
          { text: "Hoppy", isCorrect: true },
          { text: "Bunny", isCorrect: false },
          { text: "Fluffy", isCorrect: false }
        ]
      },
      spelling: {
        word: "rabbit",
        hint: "This furry animal hops around"
      },
      dragDrop: {
        dragItems: [
          { id: 'hoppy', image: 'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Hoppy the Rabbit' }
        ],
        dropZones: [
          { id: 'forest', image: 'https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Whisperwood Forest', acceptsId: 'hoppy' }
        ]
      }
    }
  },
  {
    text: "One sunny morning, Hoppy decided to venture deeper into the forest than ever before. The trees were taller here, and the flowers more colorful.",
    image: "https://images.pexels.com/photos/4588055/pexels-photo-4588055.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    background: "https://images.pexels.com/photos/1287142/pexels-photo-1287142.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "What kind of morning was it when Hoppy went exploring?",
        options: [
          { text: "Rainy", isCorrect: false },
          { text: "Sunny", isCorrect: true },
          { text: "Cloudy", isCorrect: false }
        ]
      },
      spelling: {
        word: "forest",
        hint: "A place with many trees"
      },
      dragDrop: {
        dragItems: [
          { id: 'sun', image: 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Bright Sun' },
          { id: 'flowers', image: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Colorful Flowers' }
        ],
        dropZones: [
          { id: 'sky', image: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Blue Sky', acceptsId: 'sun' },
          { id: 'garden', image: 'https://images.pexels.com/photos/1287142/pexels-photo-1287142.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Forest Garden', acceptsId: 'flowers' }
        ]
      }
    }
  },
  {
    text: "Suddenly, Hoppy heard a soft sound. It was a little bird with a blue wing who couldn't fly. 'Hello,' said Hoppy. 'My name is Hoppy. What's yours?'",
    image: "https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    background: "https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "What color was the bird's wing?",
        options: [
          { text: "Red", isCorrect: false },
          { text: "Blue", isCorrect: true },
          { text: "Green", isCorrect: false }
        ]
      },
      spelling: {
        word: "bird",
        hint: "An animal that usually flies"
      },
      dragDrop: {
        dragItems: [
          { id: 'bird', image: 'https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Little Bird' },
          { id: 'hoppy2', image: 'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Hoppy' }
        ],
        dropZones: [
          { id: 'ground', image: 'https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=200', label: 'Forest Ground', acceptsId: 'bird' },
          { id: 'path', image: 'https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Forest Path', acceptsId: 'hoppy2' }
        ]
      }
    }
  },
  {
    text: "'I'm Flutter,' said the bird. 'I hurt my wing and can't get back to my nest.' Hoppy thought for a moment, then had a brilliant idea!",
    image: "https://images.pexels.com/photos/2662434/pexels-photo-2662434.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    background: "https://images.pexels.com/photos/145863/pexels-photo-145863.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "What was the bird's name?",
        options: [
          { text: "Chirpy", isCorrect: false },
          { text: "Flutter", isCorrect: true },
          { text: "Tweety", isCorrect: false }
        ]
      },
      spelling: {
        word: "wing",
        hint: "Birds use these to fly"
      },
      dragDrop: {
        dragItems: [
          { id: 'flutter', image: 'https://images.pexels.com/photos/2662434/pexels-photo-2662434.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Flutter the Bird' }
        ],
        dropZones: [
          { id: 'nest', image: 'https://images.pexels.com/photos/531321/pexels-photo-531321.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Bird Nest', acceptsId: 'flutter' }
        ]
      }
    }
  },
  {
    text: "'Climb on my back,' said Hoppy. 'I may not fly, but I can hop very high!' And so, with Flutter on his back, Hoppy began to hop toward the tallest tree.",
    image: "https://images.pexels.com/photos/325812/pexels-photo-325812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
    background: "https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "How did Hoppy help Flutter?",
        options: [
          { text: "By flying", isCorrect: false },
          { text: "By hopping with Flutter on his back", isCorrect: true },
          { text: "By calling for help", isCorrect: false }
        ]
      },
      spelling: {
        word: "tree",
        hint: "Tall plants that grow in forests"
      },
      dragDrop: {
        dragItems: [
          { id: 'team', image: 'https://images.pexels.com/photos/325812/pexels-photo-325812.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Hoppy & Flutter' }
        ],
        dropZones: [
          { id: 'tree', image: 'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Tall Tree', acceptsId: 'team' }
        ]
      }
    }
  },
  {
    text: "Hop by hop, they made their way up the hill. It wasn't easy, but Hoppy was determined to help his new friend. Flutter directed them through the forest.",
    image: "https://images.pexels.com/photos/4588474/pexels-photo-4588474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    background: "https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "What did Flutter do to help during their journey?",
        options: [
          { text: "Sang songs", isCorrect: false },
          { text: "Directed them through the forest", isCorrect: true },
          { text: "Carried supplies", isCorrect: false }
        ]
      },
      spelling: {
        word: "friend",
        hint: "Someone you care about and help"
      },
      dragDrop: {
        dragItems: [
          { id: 'journey', image: 'https://images.pexels.com/photos/4588474/pexels-photo-4588474.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Their Journey' }
        ],
        dropZones: [
          { id: 'hill', image: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Forest Hill', acceptsId: 'journey' }
        ]
      }
    }
  },
  {
    text: "Finally, they reached Flutter's nest high in the branches. Flutter's family was overjoyed! They thanked Hoppy with songs and stories until the sun set.",
    image: "https://images.pexels.com/photos/6577903/pexels-photo-6577903.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    background: "https://images.pexels.com/photos/531321/pexels-photo-531321.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "How did Flutter's family thank Hoppy?",
        options: [
          { text: "With food", isCorrect: false },
          { text: "With songs and stories", isCorrect: true },
          { text: "With gifts", isCorrect: false }
        ]
      },
      spelling: {
        word: "family",
        hint: "People or animals who live together and care for each other"
      },
      dragDrop: {
        dragItems: [
          { id: 'family', image: 'https://images.pexels.com/photos/6577903/pexels-photo-6577903.jpeg?auto=compress&cs=tinysrgb&w=200', label: "Flutter's Family" }
        ],
        dropZones: [
          { id: 'nest2', image: 'https://images.pexels.com/photos/531321/pexels-photo-531321.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Family Nest', acceptsId: 'family' }
        ]
      }
    }
  },
  {
    text: "From that day on, Hoppy and Flutter became the best of friends, showing everyone in Whisperwood Forest that helping others is the greatest adventure of all.",
    image: "https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    video: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
    background: "https://images.pexels.com/photos/707344/pexels-photo-707344.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    quiz: {
      multipleChoice: {
        question: "What is the main lesson of this story?",
        options: [
          { text: "Always be careful in the forest", isCorrect: false },
          { text: "Helping others is the greatest adventure", isCorrect: true },
          { text: "Birds are better than rabbits", isCorrect: false }
        ]
      },
      spelling: {
        word: "adventure",
        hint: "An exciting journey or experience"
      },
      dragDrop: {
        dragItems: [
          { id: 'friendship', image: 'https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Best Friends' }
        ],
        dropZones: [
          { id: 'whisperwood', image: 'https://images.pexels.com/photos/707344/pexels-photo-707344.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Whisperwood Forest', acceptsId: 'friendship' }
        ]
      }
    }
  }
];