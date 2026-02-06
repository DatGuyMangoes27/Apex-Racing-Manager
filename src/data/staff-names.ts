// ============================================
// STAFF NAME POOLS - Gendered, Regional
// ============================================
// Large name pools to minimize repetition across career saves.
// Names are organized by gender and region, matching nationality weights.

export type StaffGender = 'male' | 'female'

export type NameRegion = 'european' | 'asian' | 'american' | 'brazilian' | 'african' | 'middle_eastern'

// ============================================
// MALE FIRST NAMES BY REGION
// ============================================

export const MALE_FIRST_NAMES: Record<NameRegion, string[]> = {
  european: [
    // British
    'Adrian', 'James', 'Oliver', 'William', 'George', 'Harry', 'Jack', 'Thomas', 'Charlie', 'Oscar',
    'Henry', 'Arthur', 'Edward', 'Samuel', 'Joseph', 'Frederick', 'Albert', 'Alfred', 'Rupert', 'Nigel',
    'Graham', 'Colin', 'Derek', 'Stuart', 'Neil', 'Keith', 'Trevor', 'Clive', 'Reginald', 'Neville',
    // German
    'Hans', 'Stefan', 'Klaus', 'Wolfgang', 'Dieter', 'Jürgen', 'Rainer', 'Manfred', 'Bernd', 'Uwe',
    'Matthias', 'Markus', 'Tobias', 'Florian', 'Sebastian', 'Lukas', 'Felix', 'Maximilian', 'Tim', 'Jan',
    'Kai', 'Lars', 'Sven', 'Thorsten', 'Volker', 'Axel', 'Dirk', 'Holger', 'Norbert', 'Ralf',
    // Italian
    'Matteo', 'Luca', 'Giovanni', 'Marco', 'Alessandro', 'Andrea', 'Lorenzo', 'Riccardo', 'Fabio', 'Paolo',
    'Roberto', 'Stefano', 'Massimo', 'Enrico', 'Davide', 'Simone', 'Alberto', 'Claudio', 'Gianluca', 'Nicola',
    'Dario', 'Emanuele', 'Vincenzo', 'Salvatore', 'Flavio', 'Gianfranco', 'Aldo', 'Angelo', 'Cesare', 'Enzo',
    // French
    'Pierre', 'Jean', 'François', 'Laurent', 'Michel', 'Thierry', 'Philippe', 'Christophe', 'Olivier', 'Nicolas',
    'Alain', 'Bruno', 'Gérard', 'Hervé', 'Julien', 'Maxime', 'Romain', 'Sylvain', 'Yves', 'Antoine',
    'Benoît', 'Cédric', 'Damien', 'Étienne', 'Fabien', 'Guillaume', 'Hugo', 'Jérôme', 'Kévin', 'Léo',
    // Spanish
    'Carlos', 'Sergio', 'Miguel', 'Alejandro', 'Javier', 'Pablo', 'Diego', 'Raúl', 'Adrián', 'Álvaro',
    'Fernando', 'Iñaki', 'Gonzalo', 'Héctor', 'Ignacio', 'Joaquín', 'Manuel', 'Óscar', 'Rubén', 'Víctor',
    // Dutch / Belgian / Scandinavian
    'Willem', 'Pieter', 'Joost', 'Maarten', 'Thijs', 'Bram', 'Daan', 'Ruben', 'Jeroen', 'Wouter',
    'Henrik', 'Magnus', 'Erik', 'Olof', 'Mikael', 'Anders', 'Björn', 'Gunnar', 'Leif', 'Torbjörn',
    'Jan-Erik', 'Nils', 'Per', 'Ragnar', 'Stellan', 'Ulf', 'Viktor', 'Yngve', 'Åke', 'Dag',
    // Czech / Polish / Eastern European
    'Tomáš', 'Petr', 'Jakub', 'Ondřej', 'Radek', 'Miroslav', 'Zdeněk', 'Jiří', 'Karel', 'Václav',
    'Krzysztof', 'Tomasz', 'Andrzej', 'Stanisław', 'Wojciech', 'Grzegorz', 'Marek', 'Piotr', 'Janusz', 'Zbigniew',
    // Swiss / Austrian
    'Christoph', 'Bernhard', 'Gerhard', 'Helmut', 'Leopold', 'Reinhard', 'Siegfried', 'Theodor', 'Werner', 'Walter',
    // Finnish
    'Kimi', 'Mika', 'Valtteri', 'Heikki', 'Jari', 'Juha', 'Kari', 'Petteri', 'Timo', 'Antti',
    // Extra variety
    'Alexander', 'Christian', 'Daniel', 'David', 'Martin', 'Michael', 'Patrick', 'Peter', 'Richard', 'Robert',
    'Simon', 'Stephen', 'Timothy', 'Victor', 'Benedict', 'Conrad', 'Edmund', 'Gerald', 'Leonard', 'Raymond',
  ],
  asian: [
    // Japanese
    'Hiroshi', 'Kenji', 'Takeshi', 'Satoshi', 'Akira', 'Kazuki', 'Haruto', 'Masato', 'Ren', 'Yuto',
    'Riku', 'Sora', 'Hinata', 'Daiki', 'Kaito', 'Shota', 'Ryota', 'Kenta', 'Naoki', 'Takumi',
    'Daisuke', 'Kenichi', 'Makoto', 'Noboru', 'Osamu', 'Ryuji', 'Shinji', 'Tatsuya', 'Yasushi', 'Yoshiki',
    'Toshiro', 'Hideo', 'Koichi', 'Mamoru', 'Shigeru', 'Tsutomu', 'Yukio', 'Atsushi', 'Fumio', 'Goro',
    'Hayato', 'Ichiro', 'Jiro', 'Kazuo', 'Minoru', 'Norihiro', 'Ryo', 'Saburo', 'Taro', 'Wataru',
    // Chinese
    'Wei', 'Jun', 'Tao', 'Min', 'Hong', 'Feng', 'Lei', 'Chao', 'Hao', 'Jian',
    'Liang', 'Peng', 'Qiang', 'Rui', 'Shan', 'Xiang', 'Yang', 'Zhi', 'Bo', 'Cheng',
    'Dong', 'Gang', 'Hui', 'Kai', 'Long', 'Ming', 'Ning', 'Ping', 'Qing', 'Song',
    'Wen', 'Xin', 'Yu', 'Zhong', 'Biao', 'Deng', 'Fu', 'Guo', 'Jie', 'Kun',
    // Korean
    'Sung', 'Jin', 'Hyun', 'Seung', 'Joon', 'Min-Ho', 'Tae', 'Woo', 'Chan', 'Dong-Hyun',
    'Gi', 'Han', 'In', 'Jae', 'Kyung', 'Nam', 'Oh', 'Pil', 'Sang', 'Yong',
    'Byung', 'Chul', 'Dae', 'Eun', 'Hwan', 'Jong', 'Kwang', 'Myung', 'Soo', 'Young',
    // Indian
    'Raj', 'Vikram', 'Anil', 'Suresh', 'Pradeep', 'Sanjay', 'Ashok', 'Ravi', 'Amit', 'Deepak',
    'Gaurav', 'Hari', 'Ishwar', 'Kiran', 'Manoj', 'Naresh', 'Pravin', 'Rahul', 'Sachin', 'Tarun',
    'Ajay', 'Bharat', 'Dinesh', 'Ganesh', 'Jitendra', 'Mohan', 'Neeraj', 'Pankaj', 'Ramesh', 'Siddharth',
    // Southeast Asian
    'Thanh', 'Bao', 'Duc', 'Minh', 'Phong', 'Quang', 'Tuan', 'Vinh',
    // Extra variety
    'Arjun', 'Dev', 'Ishaan', 'Krishna', 'Nikhil', 'Om', 'Pranav', 'Rohan', 'Sahil', 'Varun',
    'Aditya', 'Harsh', 'Kunal', 'Manish', 'Nakul', 'Parth', 'Rohit', 'Shivam', 'Tushar', 'Vivek',
  ],
  american: [
    'John', 'Michael', 'Robert', 'William', 'James', 'David', 'Richard', 'Joseph', 'Charles', 'Thomas',
    'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Andrew', 'Joshua', 'Brian', 'Kevin',
    'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Nicholas', 'Eric', 'Brandon',
    'Justin', 'Samuel', 'Benjamin', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Nathan',
    'Henry', 'Douglas', 'Peter', 'Adam', 'Zachary', 'Kyle', 'Scott', 'Frank', 'Raymond', 'Gregory',
    'Sean', 'Philip', 'Ethan', 'Dylan', 'Logan', 'Caleb', 'Luke', 'Isaac', 'Connor', 'Jordan',
    'Cameron', 'Austin', 'Blake', 'Chase', 'Cole', 'Cooper', 'Dominic', 'Elijah', 'Gavin', 'Grant',
    'Hunter', 'Ian', 'Jayden', 'Landon', 'Mason', 'Owen', 'Parker', 'Quinn', 'Riley', 'Spencer',
    'Tristan', 'Wesley', 'Xavier', 'Aiden', 'Carter', 'Easton', 'Liam', 'Noah', 'Derek', 'Craig',
    'Troy', 'Brent', 'Chad', 'Cody', 'Dustin', 'Garrett', 'Mitchell', 'Travis', 'Wade', 'Warren',
    'Glenn', 'Bruce', 'Curtis', 'Darren', 'Eugene', 'Floyd', 'Gordon', 'Harold', 'Irving', 'Jerome',
    'Kenneth', 'Lawrence', 'Marshall', 'Nelson', 'Oscar', 'Perry', 'Quentin', 'Ralph', 'Russell', 'Stuart',
    'Vernon', 'Wallace', 'Clay', 'Devin', 'Forrest', 'Heath', 'Jared', 'Kent', 'Lane', 'Miles',
    'Nash', 'Pierce', 'Reed', 'Shane', 'Trent', 'Vince', 'Wyatt', 'Zane', 'Colton', 'Dalton',
    'Elliot', 'Fletcher', 'Gibson', 'Hayes', 'Jasper', 'Knox', 'Lincoln', 'Maddox', 'Nolan', 'Porter',
    'Rowan', 'Sawyer', 'Tate', 'Walker', 'Barrett', 'Beckett', 'Callum', 'Davis', 'Emerson', 'Finn',
    'Griffin', 'Holden', 'Jensen', 'Kai', 'Leo', 'Max', 'Nico', 'Otto', 'Phoenix', 'Remy',
    'Sterling', 'Tobias', 'Vance', 'Weston', 'Axel', 'Brooks', 'Clark', 'Drake', 'Ellis', 'Ford',
    'Gray', 'Hugo', 'Ivan', 'Julius', 'Keith', 'Lance', 'Marcus', 'Neil', 'Oliver', 'Paul',
    'Rex', 'Seth', 'Todd', 'Vaughn', 'Wayne', 'Alec', 'Brett', 'Clyde', 'Drew', 'Evan',
  ],
  brazilian: [
    'Rafael', 'Lucas', 'Felipe', 'Bruno', 'Pedro', 'Gabriel', 'Matheus', 'Leonardo', 'Guilherme', 'Thiago',
    'Caio', 'Eduardo', 'Rodrigo', 'Gustavo', 'Fernando', 'Ricardo', 'André', 'Marcos', 'Paulo', 'Fábio',
    'Diego', 'Vinícius', 'Henrique', 'Alexandre', 'Victor', 'Daniel', 'Leandro', 'Anderson', 'Renato', 'Marcelo',
    'Luís', 'Cláudio', 'Sérgio', 'Adriano', 'Washington', 'Rogério', 'Márcio', 'Flávio', 'Emerson', 'Renan',
    'Tales', 'Igor', 'Hugo', 'Otávio', 'Samuel', 'Arthur', 'Murilo', 'Enzo', 'Davi', 'Miguel',
    'Bernardo', 'Heitor', 'Théo', 'Lorenzo', 'Valentim', 'Benício', 'Vicente', 'Levi', 'Gael', 'Noah',
    'Ravi', 'Caleb', 'Antônio', 'Joaquim', 'Francisco', 'Bento', 'Emanuel', 'Heloísio', 'Raul', 'Breno',
    'Cauã', 'Ryan', 'Yuri', 'Ian', 'Bryan', 'Danilo', 'Elias', 'Jonas', 'Mateus', 'Tiago',
    'Nelson', 'Osvaldo', 'Plínio', 'Raimundo', 'Silvio', 'Túlio', 'Ulisses', 'Valdir', 'Wagner', 'Xavier',
    'Abelardo', 'Benedito', 'Cícero', 'Demétrio', 'Estevão', 'Feliciano', 'Geraldo', 'Humberto', 'Ícaro', 'Jefferson',
    'Kleber', 'Laércio', 'Mário', 'Norberto', 'Orlando', 'Paschoal', 'Quirino', 'Robson', 'Sidnei', 'Tadeu',
    'Ubiratã', 'Vanderlei', 'Wendel', 'Zacarias', 'Augusto', 'Baltazar', 'Célio', 'Donato', 'Edson', 'Firmino',
    'Giovanni', 'Hilton', 'Ítalo', 'Júlio', 'Kauê', 'Luciano', 'Milton', 'Neílton', 'Olavo', 'Pietro',
    'Ramon', 'Saulo', 'Tomás', 'Uriel', 'Valério', 'Willian', 'Yago', 'Zeca', 'Alisson', 'Brenno',
    'Cristiano', 'Douglas', 'Evandro', 'Fausto', 'Giovane', 'Hélio', 'Isaque', 'Josué', 'Kevin', 'Luan',
    'Maurício', 'Neymar', 'Omar', 'Patrick', 'Raí', 'Sandro', 'Thales', 'Uélber', 'Vagner', 'Wesley',
  ],
  african: [
    'Kwame', 'Kofi', 'Yaw', 'Kwesi', 'Kojo', 'Kwabena', 'Ebo', 'Mensah', 'Nana', 'Osei',
    'Adekunle', 'Oluwaseun', 'Chukwuemeka', 'Obinna', 'Tunde', 'Babatunde', 'Olumide', 'Kehinde', 'Taiwo', 'Adebayo',
    'Amara', 'Boubacar', 'Cheick', 'Diallo', 'Ibrahima', 'Mamadou', 'Moussa', 'Ousmane', 'Sekou', 'Souleymane',
    'Abel', 'Bereket', 'Dawit', 'Eskinder', 'Fikru', 'Girma', 'Haile', 'Isaias', 'Kidane', 'Lemma',
    'Musa', 'Nkosi', 'Oluwafemi', 'Precious', 'Rashidi', 'Sipho', 'Thabo', 'Uzoma', 'Wale', 'Yusuf',
    'Chinedu', 'Emeka', 'Femi', 'Gbenga', 'Hassan', 'Idrissa', 'Jelani', 'Kalu', 'Lamine', 'Ndidi',
    'Onyeka', 'Prosper', 'Rufai', 'Samson', 'Tariku', 'Udo', 'Victor', 'Wisdom', 'Yakubu', 'Zubair',
    'Adama', 'Bakary', 'Celestin', 'Demba', 'Emmanuel', 'Fousseni', 'Godfrey', 'Herve', 'Innocent', 'Joseph',
    'Kalifa', 'Landry', 'Mohamed', 'Ngolo', 'Olivier', 'Patrick', 'Quincy', 'Robert', 'Stephane', 'Thierry',
    'Urbain', 'Venance', 'Wilfried', 'Xavier', 'Yaya', 'Zakaria', 'Anthony', 'Benjamin', 'Christian', 'Daniel',
    'Eric', 'Francis', 'George', 'Henry', 'Isaac', 'John', 'Kenneth', 'Leonard', 'Michael', 'Nelson',
    'Oscar', 'Philip', 'Raymond', 'Solomon', 'Timothy', 'Uche', 'Vincent', 'William', 'Yeboah', 'Zion',
    'Abdoulaye', 'Blaise', 'Cyril', 'Drogba', 'Eliud', 'Fabrice', 'Gerald', 'Habib', 'Ibrahim', 'Julius',
    'Kingsley', 'Lucky', 'Maxwell', 'Nicholas', 'Obed', 'Peter', 'Reuben', 'Samuel', 'Thomas', 'Unity',
  ],
  middle_eastern: [
    'Ahmed', 'Mohammed', 'Ali', 'Hassan', 'Omar', 'Ibrahim', 'Khalid', 'Tariq', 'Youssef', 'Nasser',
    'Samir', 'Karim', 'Faisal', 'Rashid', 'Hamza', 'Bilal', 'Zayed', 'Sultan', 'Majid', 'Waleed',
    'Adel', 'Bashar', 'Darius', 'Ehsan', 'Farhan', 'Ghassan', 'Hisham', 'Ismail', 'Jamal', 'Kareem',
    'Latif', 'Mansour', 'Nabil', 'Othman', 'Qasim', 'Ridwan', 'Sami', 'Tahir', 'Umar', 'Wael',
    'Yasir', 'Zaki', 'Abdulrahman', 'Badr', 'Fahad', 'Habib', 'Jawad', 'Marwan', 'Rami', 'Saleh',
    'Tarek', 'Abbas', 'Bashir', 'Dalil', 'Emir', 'Fouad', 'Ghazi', 'Hakim', 'Idris', 'Jalal',
    'Kais', 'Luay', 'Mazen', 'Nadir', 'Osama', 'Payam', 'Rafiq', 'Sharif', 'Tawfiq', 'Usama',
    'Wahid', 'Yaser', 'Zahir', 'Amir', 'Baha', 'Cyrus', 'Davood', 'Eskandar', 'Farzad', 'Gholam',
    'Hamid', 'Iman', 'Javad', 'Kamran', 'Leith', 'Mehdi', 'Navid', 'Omid', 'Parviz', 'Reza',
    'Shahram', 'Touraj', 'Vahid', 'Yasin', 'Zain', 'Arash', 'Behnam', 'Dariush', 'Erfan', 'Feroz',
    'Hadi', 'Jaber', 'Khaled', 'Mazhar', 'Nouman', 'Obaid', 'Pervez', 'Qais', 'Riaz', 'Sulaiman',
    'Talal', 'Uzair', 'Waseem', 'Yaqub', 'Zakariya', 'Anwar', 'Bakr', 'Danish', 'Farid', 'Junaid',
  ],
}

// ============================================
// FEMALE FIRST NAMES BY REGION
// ============================================

export const FEMALE_FIRST_NAMES: Record<NameRegion, string[]> = {
  european: [
    // British
    'Charlotte', 'Amelia', 'Olivia', 'Emily', 'Sophie', 'Grace', 'Jessica', 'Lucy', 'Eleanor', 'Victoria',
    'Catherine', 'Margaret', 'Elizabeth', 'Alexandra', 'Diana', 'Fiona', 'Hannah', 'Isla', 'Kate', 'Laura',
    'Megan', 'Natasha', 'Pippa', 'Rebecca', 'Sarah', 'Tara', 'Wendy', 'Zoe', 'Claire', 'Emma',
    // German
    'Anna', 'Lena', 'Katharina', 'Sabine', 'Monika', 'Petra', 'Ursula', 'Ingrid', 'Heike', 'Birgit',
    'Claudia', 'Susanne', 'Martina', 'Brigitte', 'Gabriele', 'Stefanie', 'Andrea', 'Anja', 'Simone', 'Julia',
    'Leonie', 'Maja', 'Nele', 'Frieda', 'Greta', 'Hanna', 'Ida', 'Johanna', 'Karla', 'Lotte',
    // Italian
    'Giulia', 'Francesca', 'Alessia', 'Chiara', 'Valentina', 'Silvia', 'Paola', 'Roberta', 'Elisa', 'Federica',
    'Ilaria', 'Marta', 'Sara', 'Teresa', 'Beatrice', 'Daniela', 'Elena', 'Flavia', 'Giada', 'Lucia',
    'Monica', 'Nicoletta', 'Ornella', 'Patrizia', 'Rosa', 'Serena', 'Tiziana', 'Viola', 'Arianna', 'Bianca',
    // French
    'Marie', 'Sophie', 'Camille', 'Léa', 'Manon', 'Chloé', 'Élodie', 'Nathalie', 'Isabelle', 'Céline',
    'Aurélie', 'Delphine', 'Florence', 'Geneviève', 'Hélène', 'Justine', 'Louise', 'Marguerite', 'Noémie', 'Pauline',
    'Sandrine', 'Thérèse', 'Valérie', 'Yvette', 'Adèle', 'Brigitte', 'Colette', 'Dominique', 'Estelle', 'Fleur',
    // Spanish
    'María', 'Carmen', 'Ana', 'Isabel', 'Laura', 'Lucía', 'Elena', 'Sofía', 'Paula', 'Alba',
    'Beatriz', 'Clara', 'Diana', 'Eva', 'Fernanda', 'Gabriela', 'Irene', 'Julia', 'Lorena', 'Nuria',
    // Dutch / Belgian / Scandinavian
    'Astrid', 'Freya', 'Ingrid', 'Linnéa', 'Sigrid', 'Annika', 'Birgitta', 'Dagny', 'Elsa', 'Frida',
    'Greta', 'Hedda', 'Inga', 'Karin', 'Liv', 'Maja', 'Nora', 'Petra', 'Saga', 'Tova',
    // Czech / Polish / Eastern European
    'Katarina', 'Markéta', 'Tereza', 'Lenka', 'Jana', 'Eva', 'Lucie', 'Hana', 'Barbora', 'Veronika',
    'Agnieszka', 'Beata', 'Dorota', 'Ewa', 'Grażyna', 'Halina', 'Iwona', 'Jadwiga', 'Katarzyna', 'Magdalena',
    // Finnish
    'Aino', 'Minna', 'Sanna', 'Tiina', 'Päivi', 'Heli', 'Kaisa', 'Leena', 'Riikka', 'Tarja',
    // Extra variety
    'Alice', 'Beatrice', 'Caroline', 'Dorothea', 'Evelyn', 'Felicity', 'Georgina', 'Helena', 'Imogen', 'Josephine',
    'Katherine', 'Lydia', 'Miranda', 'Natalie', 'Octavia', 'Penelope', 'Rosalind', 'Sylvia', 'Tabitha', 'Vivienne',
  ],
  asian: [
    // Japanese
    'Yuki', 'Sakura', 'Hana', 'Aoi', 'Misaki', 'Rin', 'Mei', 'Sora', 'Hikari', 'Akane',
    'Ayumi', 'Chihiro', 'Emi', 'Fumiko', 'Haruka', 'Izumi', 'Junko', 'Keiko', 'Maki', 'Natsuki',
    'Reiko', 'Sachiko', 'Tomoko', 'Yoko', 'Asuka', 'Chiaki', 'Eriko', 'Hitomi', 'Kanako', 'Madoka',
    'Noriko', 'Riko', 'Sayuri', 'Takako', 'Yumi', 'Ai', 'Chie', 'Etsuko', 'Hinata', 'Kaoru',
    'Midori', 'Nanami', 'Rio', 'Shizuka', 'Yui', 'Akiko', 'Chiyo', 'Fuyumi', 'Honoka', 'Kazue',
    // Chinese
    'Li', 'Mei', 'Xia', 'Jing', 'Ying', 'Fang', 'Ling', 'Yan', 'Hui', 'Na',
    'Qian', 'Rong', 'Shan', 'Ting', 'Wen', 'Xin', 'Yi', 'Zhen', 'Ai', 'Bao',
    'Chun', 'Dan', 'En', 'Fen', 'Gui', 'Hong', 'Juan', 'Lan', 'Min', 'Ping',
    'Qiu', 'Ru', 'Si', 'Tong', 'Wei', 'Xue', 'Yun', 'Zhi', 'Hua', 'Lian',
    // Korean
    'Ji-Yeon', 'Min-Ji', 'Soo-Jin', 'Hye-Won', 'Eun-Jung', 'Da-Hye', 'Yeon-Seo', 'Ha-Na', 'Bo-Ram', 'Chae-Won',
    'Ga-Young', 'Hee-Jin', 'In-Sook', 'Jung-Ah', 'Kyung-Mi', 'Mi-Ran', 'Na-Young', 'Ok-Hee', 'Seo-Yeon', 'Ye-Rin',
    // Indian
    'Priya', 'Ananya', 'Aisha', 'Deepika', 'Kavitha', 'Lakshmi', 'Meera', 'Nandini', 'Pooja', 'Radha',
    'Shalini', 'Tanvi', 'Uma', 'Vidya', 'Anjali', 'Bhavna', 'Chitra', 'Divya', 'Geeta', 'Isha',
    'Jaya', 'Kamala', 'Lata', 'Madhuri', 'Neha', 'Pallavi', 'Rani', 'Sunita', 'Trishna', 'Vasundhara',
    // Southeast Asian
    'Linh', 'Hanh', 'Mai', 'Ngoc', 'Phuong', 'Thuy', 'Trang', 'Van',
    // Extra variety
    'Aditi', 'Devi', 'Fatima', 'Gauri', 'Hema', 'Indira', 'Jyoti', 'Kalpana', 'Mala', 'Nisha',
    'Padma', 'Rekha', 'Savitri', 'Usha', 'Veena', 'Yamuna', 'Zara', 'Aruna', 'Bhanu', 'Champa',
  ],
  american: [
    'Jennifer', 'Jessica', 'Ashley', 'Amanda', 'Sarah', 'Stephanie', 'Nicole', 'Heather', 'Elizabeth', 'Megan',
    'Michelle', 'Samantha', 'Christina', 'Lisa', 'Kimberly', 'Brittany', 'Rachel', 'Lauren', 'Rebecca', 'Amber',
    'Emily', 'Olivia', 'Abigail', 'Madison', 'Sophia', 'Chloe', 'Ella', 'Avery', 'Harper', 'Aria',
    'Scarlett', 'Victoria', 'Grace', 'Lily', 'Natalie', 'Hannah', 'Addison', 'Brooklyn', 'Eleanor', 'Savannah',
    'Hazel', 'Violet', 'Claire', 'Penelope', 'Riley', 'Layla', 'Zoe', 'Nora', 'Leah', 'Audrey',
    'Maya', 'Stella', 'Paisley', 'Skylar', 'Aubrey', 'Genesis', 'Emilia', 'Kennedy', 'Willow', 'Autumn',
    'Katherine', 'Allison', 'Alexandra', 'Catherine', 'Dorothy', 'Evelyn', 'Frances', 'Georgia', 'Helen', 'Irene',
    'Janet', 'Karen', 'Linda', 'Margaret', 'Nancy', 'Patricia', 'Ruth', 'Susan', 'Teresa', 'Virginia',
    'Wendy', 'Diana', 'Brenda', 'Carolyn', 'Deborah', 'Gloria', 'Janice', 'Marie', 'Pamela', 'Sharon',
    'Tanya', 'Vanessa', 'Whitney', 'Adrienne', 'Bethany', 'Crystal', 'Danielle', 'Erica', 'Faith', 'Gwendolyn',
    'Holly', 'Ingrid', 'Jade', 'Kelsey', 'Lacey', 'Melanie', 'Noelle', 'Paige', 'Quinn', 'Raven',
    'Shelby', 'Tiffany', 'Unity', 'Veronica', 'Winter', 'Alexis', 'Bailey', 'Cassandra', 'Destiny', 'Eden',
    'Felicia', 'Gianna', 'Hope', 'Ivy', 'Jordan', 'Keira', 'Luna', 'Morgan', 'Naomi', 'Olive',
    'Piper', 'Reese', 'Sienna', 'Taylor', 'Uma', 'Valerie', 'Wren', 'Ximena', 'Yasmine', 'Zoey',
    'Alana', 'Blair', 'Carmen', 'Daphne', 'Elise', 'Faye', 'Giselle', 'Harmony', 'Iris', 'Juliet',
    'Kira', 'Lena', 'Mia', 'Nina', 'Ophelia', 'Pearl', 'Rosa', 'Sage', 'Thea', 'Una',
    'Vera', 'Willa', 'Yolanda', 'Zara', 'Astrid', 'Brooke', 'Clara', 'Delia', 'Esther', 'Flora',
    'Genevieve', 'Hailey', 'Iliana', 'Josie', 'Kinsley', 'Lola', 'Maeve', 'Nell', 'Opal', 'Priscilla',
  ],
  brazilian: [
    'Ana', 'Maria', 'Juliana', 'Fernanda', 'Patricia', 'Camila', 'Amanda', 'Letícia', 'Gabriela', 'Bruna',
    'Larissa', 'Mariana', 'Beatriz', 'Carolina', 'Daniela', 'Eduarda', 'Fabiana', 'Helena', 'Isabela', 'Júlia',
    'Karen', 'Luciana', 'Manuela', 'Natália', 'Olívia', 'Priscila', 'Rafaela', 'Sabrina', 'Tatiana', 'Valéria',
    'Aline', 'Bianca', 'Cristina', 'Débora', 'Elaine', 'Flávia', 'Giovana', 'Heloísa', 'Irene', 'Joana',
    'Kátia', 'Luana', 'Michele', 'Nayara', 'Patrícia', 'Renata', 'Simone', 'Thaís', 'Viviane', 'Yara',
    'Adriana', 'Bárbara', 'Cláudia', 'Denise', 'Érica', 'Franciely', 'Graziela', 'Hilda', 'Ivone', 'Jéssica',
    'Kelly', 'Lorena', 'Márcia', 'Neusa', 'Odete', 'Pietra', 'Raquel', 'Solange', 'Teresa', 'Úrsula',
    'Vanessa', 'Wanda', 'Ximena', 'Yasmin', 'Zilda', 'Alice', 'Betina', 'Cecília', 'Diana', 'Elisa',
    'Flora', 'Gisele', 'Hortência', 'Ingrid', 'Jasmim', 'Laís', 'Maitê', 'Nina', 'Paloma', 'Regina',
    'Stella', 'Tainá', 'Valentina', 'Vitória', 'Aurora', 'Catarina', 'Emília', 'Lívia', 'Mirella', 'Sofia',
    'Antônia', 'Berenice', 'Carmem', 'Dolores', 'Esmeralda', 'Francisca', 'Glória', 'Ines', 'Josefa', 'Leonor',
    'Madalena', 'Nazaré', 'Olga', 'Perpetua', 'Rosário', 'Silvana', 'Tereza', 'Vera', 'Zenaide', 'Aparecida',
  ],
  african: [
    'Amina', 'Fatima', 'Aisha', 'Zainab', 'Khadija', 'Mariam', 'Halima', 'Nafisa', 'Rukia', 'Salma',
    'Ade', 'Binta', 'Chioma', 'Damilola', 'Ebele', 'Folake', 'Gbemisola', 'Hauwa', 'Ife', 'Jumoke',
    'Kehinde', 'Lola', 'Maryam', 'Ngozi', 'Oluchi', 'Patience', 'Ronke', 'Sade', 'Tinuke', 'Uzoma',
    'Wanjiku', 'Yetunde', 'Zuri', 'Abena', 'Bisi', 'Chiamaka', 'Dayo', 'Eno', 'Funke', 'Grace',
    'Hope', 'Iyabo', 'Joy', 'Kemi', 'Lami', 'Mercy', 'Nneka', 'Onyinye', 'Precious', 'Queen',
    'Ruth', 'Simi', 'Temi', 'Uju', 'Vivian', 'Wumi', 'Yinka', 'Zanele', 'Adaeze', 'Blessing',
    'Comfort', 'Divine', 'Esther', 'Faith', 'Gladys', 'Hannah', 'Ifeoma', 'Josephine', 'Kelechi', 'Linda',
    'Millicent', 'Nkechi', 'Obiageli', 'Perpetua', 'Rosemary', 'Stella', 'Theresa', 'Uchechi', 'Victoria', 'Winnie',
    'Agnes', 'Beatrice', 'Catherine', 'Doris', 'Elizabeth', 'Florence', 'Gertrude', 'Helen', 'Irene', 'Janet',
    'Katherine', 'Lydia', 'Martha', 'Nana', 'Ophelia', 'Pauline', 'Rachel', 'Salome', 'Tabitha', 'Unity',
  ],
  middle_eastern: [
    'Fatima', 'Aisha', 'Maryam', 'Zahra', 'Khadija', 'Noor', 'Layla', 'Sara', 'Hana', 'Yasmin',
    'Amira', 'Dina', 'Farah', 'Ghada', 'Huda', 'Iman', 'Jamila', 'Karima', 'Leila', 'Maha',
    'Nadia', 'Omnia', 'Rania', 'Samira', 'Tahira', 'Wafa', 'Yara', 'Zainab', 'Abeer', 'Basma',
    'Dalal', 'Elham', 'Firdaus', 'Habiba', 'Inaya', 'Jihan', 'Lamia', 'Mona', 'Nawal', 'Rabia',
    'Sahar', 'Tala', 'Widad', 'Yusra', 'Zubaida', 'Arwa', 'Bushra', 'Duaa', 'Esra', 'Farida',
    'Ghaliya', 'Haleh', 'Inas', 'Jihane', 'Kenza', 'Lubna', 'Malak', 'Nesrin', 'Parisa', 'Reem',
    'Sana', 'Thuraya', 'Warda', 'Zara', 'Amal', 'Bahar', 'Dalia', 'Faten', 'Hayat', 'Latifa',
    'Marwa', 'Noura', 'Rawda', 'Shahla', 'Taghreed', 'Vida', 'Zareen', 'Aziza', 'Badia', 'Firuzeh',
    'Golnar', 'Hasti', 'Jaleh', 'Kiana', 'Ladan', 'Mahsa', 'Nasrin', 'Pari', 'Roxana', 'Shirin',
    'Taraneh', 'Vida', 'Yasaman', 'Ziba', 'Azar', 'Darya', 'Elnaz', 'Fereshteh', 'Ghazal', 'Hedieh',
  ],
}

// ============================================
// LAST NAMES BY REGION
// ============================================

export const LAST_NAMES: Record<NameRegion, string[]> = {
  european: [
    // British
    'Newey', 'Brown', 'Smith', 'Taylor', 'Wilson', 'Davies', 'Evans', 'Roberts', 'Walker', 'Wright',
    'Thompson', 'White', 'Hughes', 'Green', 'Hall', 'Lewis', 'Harris', 'Clarke', 'Robinson', 'Mitchell',
    'King', 'Turner', 'Hill', 'Scott', 'Moore', 'Wood', 'Ward', 'Morris', 'Young', 'Allen',
    // German
    'Mueller', 'Schmidt', 'Weber', 'Fischer', 'Bauer', 'Schneider', 'Wagner', 'Hoffmann', 'Keller', 'Richter',
    'Wolf', 'Klein', 'Meyer', 'Schwarz', 'Neumann', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange',
    'Werner', 'Schäfer', 'Lehmann', 'Koch', 'Vogt', 'Friedrich', 'Günther', 'Berger', 'Roth', 'Beck',
    // Italian
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
    'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
    // French
    'Dupont', 'Durand', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefevre', 'Leroy', 'Roux', 'David',
    'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dubois', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent',
    // Spanish
    'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Gonzalez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
    'Flores', 'Rivera', 'Gomez', 'Diaz', 'Morales', 'Reyes', 'Cruz', 'Ortiz', 'Gutierrez', 'Chavez',
    // Dutch / Belgian
    'De Vries', 'Van Dijk', 'Bakker', 'Jansen', 'Visser', 'Smit', 'Meijer', 'De Boer', 'Mulder', 'De Groot',
    // Scandinavian
    'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Lindqvist',
    'Hansen', 'Larsen', 'Eriksen', 'Nielsen', 'Pedersen', 'Christensen', 'Rasmussen', 'Madsen', 'Andersen', 'Olsen',
    // Czech / Polish / Eastern European
    'Novák', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Marek', 'Pospíšil',
    'Kowalski', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski',
    // Finnish
    'Virtanen', 'Korhonen', 'Nieminen', 'Mäkinen', 'Hämäläinen', 'Laine', 'Heikkinen', 'Koskinen', 'Järvinen', 'Lehtonen',
    // Swiss / Austrian
    'Steiner', 'Brunner', 'Huber', 'Schmid', 'Gerber', 'Wyss', 'Moser', 'Frei', 'Hofer', 'Gruber',
    // Extra variety
    'Berg', 'Borg', 'Forsberg', 'Hedlund', 'Lund', 'Nyman', 'Ström', 'Wikström', 'Åberg', 'Öberg',
    'Armstrong', 'Blackwood', 'Crawford', 'Drummond', 'Elliot', 'Fleming', 'Grant', 'Hamilton', 'Kerr', 'Maxwell',
    'Sterling', 'Barton', 'Clifton', 'Drake', 'Everett', 'Fairfax', 'Graves', 'Harding', 'Langley', 'Preston',
  ],
  asian: [
    // Japanese
    'Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe', 'Kobayashi', 'Nakamura', 'Takahashi', 'Saito', 'Kato', 'Yoshida',
    'Mori', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Shimizu', 'Hayashi', 'Abe', 'Yamazaki',
    'Ishikawa', 'Ikeda', 'Hashimoto', 'Ogawa', 'Okada', 'Fujita', 'Goto', 'Hasegawa', 'Murakami', 'Nishimura',
    'Ono', 'Sakamoto', 'Tsuda', 'Uchida', 'Wada', 'Aoki', 'Endo', 'Honda', 'Ishida', 'Kawaguchi',
    // Chinese
    'Zhang', 'Wang', 'Li', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Lin', 'Luo', 'Zheng',
    'Deng', 'Feng', 'Han', 'Jiang', 'Liang', 'Pan', 'Qin', 'Ren', 'Shen', 'Tang',
    'Wan', 'Xie', 'Ye', 'Zeng', 'Cao', 'Cheng', 'Dai', 'Fang', 'Gao', 'Song',
    // Korean
    'Kim', 'Park', 'Lee', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
    'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Ryu', 'Jeon',
    // Indian
    'Patel', 'Sharma', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Joshi', 'Iyer', 'Nair', 'Reddy',
    'Rao', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Das', 'Bose', 'Ghosh', 'Sen', 'Dutta', 'Agarwal',
    'Khanna', 'Malhotra', 'Kapoor', 'Arora', 'Thakur', 'Verma', 'Mishra', 'Pandey', 'Trivedi', 'Desai',
    'Pillai', 'Menon', 'Kamath', 'Hegde', 'Kulkarni', 'Patil', 'Bhatt', 'Shah', 'Modi', 'Soni',
    // Southeast Asian
    'Nguyen', 'Tran', 'Le', 'Pham', 'Vo', 'Bui', 'Dang', 'Dinh',
    // Extra variety
    'Taniguchi', 'Ueda', 'Fukuda', 'Nishida', 'Okamoto', 'Sakurai', 'Takada', 'Yamaguchi', 'Harada', 'Miura',
  ],
  american: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson',
    'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis',
    'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
    'Adams', 'Baker', 'Nelson', 'Mitchell', 'Campbell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner',
    'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris', 'Murphy', 'Cook', 'Rogers',
    'Morgan', 'Peterson', 'Cooper', 'Reed', 'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard', 'Ward',
    'Cox', 'Diaz', 'Richardson', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James', 'Reyes',
    'Cruz', 'Hughes', 'Price', 'Myers', 'Long', 'Foster', 'Sanders', 'Ross', 'Morales', 'Powell',
    'Sullivan', 'Russell', 'Ortiz', 'Jenkins', 'Gutierrez', 'Perry', 'Butler', 'Barnes', 'Fisher', 'Henderson',
    'Coleman', 'Simmons', 'Patterson', 'Jordan', 'Reynolds', 'Hamilton', 'Graham', 'Kim', 'Gonzales', 'Alexander',
    'Ramos', 'Wallace', 'Griffin', 'West', 'Cole', 'Hayes', 'Chavez', 'Gibson', 'Bryant', 'Ellis',
    'Stevens', 'Murray', 'Ford', 'Marshall', 'Owens', 'McDonald', 'Harrison', 'Ruiz', 'Kennedy', 'Wells',
    'Alvarez', 'Woods', 'Mendoza', 'Castillo', 'Olson', 'Webb', 'Washington', 'Tucker', 'Freeman', 'Burns',
    'Henry', 'Vasquez', 'Snyder', 'Simpson', 'Crawford', 'Jimenez', 'Porter', 'Mason', 'Shaw', 'Gordon',
    'Wagner', 'Hunter', 'Romero', 'Hicks', 'Dixon', 'Hunt', 'Palmer', 'Robertson', 'Black', 'Holmes',
    'Stone', 'Meyer', 'Boyd', 'Mills', 'Warren', 'Fox', 'Rose', 'Rice', 'Moreno', 'Schmidt',
  ],
  brazilian: [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
    'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
    'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Araujo', 'Pinto', 'Correia', 'Campos', 'Batista',
    'Melo', 'Moura', 'Azevedo', 'Castro', 'Monteiro', 'Tavares', 'Cunha', 'Reis', 'Medeiros', 'Fonseca',
    'Barros', 'Borges', 'Braga', 'Brito', 'Cabral', 'Caldeira', 'Camargo', 'Carneiro', 'Coelho', 'Domingues',
    'Duarte', 'Esteves', 'Faria', 'Figueiredo', 'Franco', 'Guedes', 'Guimarães', 'Lacerda', 'Leal', 'Leite',
    'Lemos', 'Lisboa', 'Macedo', 'Magalhães', 'Maia', 'Miranda', 'Nogueira', 'Nóbrega', 'Pacheco', 'Paiva',
    'Peixoto', 'Pimentel', 'Pires', 'Porto', 'Queiroz', 'Rêgo', 'Resende', 'Sá', 'Sales', 'Sampaio',
    'Siqueira', 'Sousa', 'Toledo', 'Trindade', 'Vasconcelos', 'Viana', 'Xavier', 'Assis', 'Brandão', 'Chaves',
    'Dantas', 'Dourado', 'Evangelista', 'Flores', 'Galvão', 'Henrique', 'Jardim', 'Lago', 'Mattos', 'Mesquita',
    'Motta', 'Padilha', 'Passos', 'Penha', 'Rangel', 'Saraiva', 'Serpa', 'Simões', 'Valente', 'Vilela',
  ],
  african: [
    'Okafor', 'Adeyemi', 'Mensah', 'Nkrumah', 'Diallo', 'Traore', 'Keita', 'Toure', 'Dembele', 'Coulibaly',
    'Okonkwo', 'Chukwuma', 'Abubakar', 'Ibrahim', 'Mwangi', 'Kamau', 'Otieno', 'Ochieng', 'Wekesa', 'Kipchoge',
    'Abdallah', 'Bakari', 'Chirwa', 'Dlamini', 'Eze', 'Fofana', 'Gueye', 'Haidara', 'Issa', 'Jallow',
    'Konate', 'Lamine', 'Mbeki', 'Ndlovu', 'Osei', 'Phiri', 'Sanou', 'Tetteh', 'Uthman', 'Yeboah',
    'Zuma', 'Amadi', 'Balogun', 'Cissé', 'Diop', 'Essien', 'Faye', 'Gbaja', 'Hamza', 'Idris',
    'Joseh', 'Kanu', 'Lawal', 'Moyo', 'Ndiaye', 'Okoro', 'Sackey', 'Sesay', 'Owusu', 'Asante',
    'Boateng', 'Danquah', 'Adu', 'Frimpong', 'Gyasi', 'Kumah', 'Ofori', 'Quarshie', 'Sarpong', 'Twumasi',
    'Annan', 'Badu', 'Donkor', 'Inkoom', 'Lamptey', 'Opoku', 'Prempeh', 'Quaye', 'Tawiah', 'Wiredu',
    'Abdi', 'Baraka', 'Chege', 'Gitonga', 'Karanja', 'Mutua', 'Njoroge', 'Odhiambo', 'Rotich', 'Wanjala',
    'Banda', 'Chanda', 'Kabwe', 'Lungu', 'Mbewe', 'Ngoma', 'Sakala', 'Tembo', 'Zimba', 'Zulu',
  ],
  middle_eastern: [
    'Al-Rashid', 'Al-Maktoum', 'Al-Thani', 'Al-Sabah', 'Al-Nahyan', 'Al-Khalifa', 'Al-Hashimi', 'Al-Saud', 'Al-Qasimi', 'Al-Sharif',
    'Hosseini', 'Mohammadi', 'Ahmadi', 'Karimi', 'Rahimi', 'Hashemi', 'Moradi', 'Jafari', 'Taheri', 'Bagheri',
    'Abbasi', 'Nazari', 'Sadeghi', 'Rezaei', 'Mousavi', 'Ghorbani', 'Hakimi', 'Amini', 'Akhtar', 'Bakhtiari',
    'Khorasani', 'Shirazi', 'Esfahani', 'Tabrizi', 'Mazandarani', 'Gilani', 'Baluchi', 'Tehrani', 'Yazdi', 'Kashani',
    'Yilmaz', 'Kaya', 'Demir', 'Celik', 'Sahin', 'Yildiz', 'Aydin', 'Ozturk', 'Arslan', 'Dogan',
    'Kilic', 'Aslan', 'Cetin', 'Kara', 'Aksoy', 'Polat', 'Erdogan', 'Taskin', 'Bayrak', 'Yildirim',
    'Mansouri', 'Alavi', 'Beheshti', 'Chamanara', 'Darvish', 'Ebrahimi', 'Farrokhi', 'Ghasemi', 'Hosseinzadeh', 'Islami',
    'Javadi', 'Khalili', 'Lotfi', 'Mirza', 'Nouri', 'Omidi', 'Parvizi', 'Rahmani', 'Salehi', 'Tavakoli',
    'Vaziri', 'Zamani', 'Askari', 'Daneshvar', 'Fallahi', 'Hedayat', 'Kamali', 'Moghadam', 'Naseri', 'Rostami',
    'Safavi', 'Toghiani', 'Zandi', 'Bahrami', 'Davoodi', 'Fattahi', 'Golzar', 'Izadi', 'Jamshidi', 'Khosravi',
  ],
}

// ============================================
// NATIONALITY CONFIG WITH REGIONS
// ============================================

export interface NationalityConfig {
  country: string
  region: NameRegion
  weight: number
}

export const NATIONALITIES: NationalityConfig[] = [
  // European
  { country: 'United Kingdom', region: 'european', weight: 15 },
  { country: 'Germany', region: 'european', weight: 12 },
  { country: 'Italy', region: 'european', weight: 10 },
  { country: 'France', region: 'european', weight: 8 },
  { country: 'Spain', region: 'european', weight: 6 },
  { country: 'Netherlands', region: 'european', weight: 5 },
  { country: 'Austria', region: 'european', weight: 4 },
  { country: 'Switzerland', region: 'european', weight: 3 },
  { country: 'Belgium', region: 'european', weight: 3 },
  { country: 'Sweden', region: 'european', weight: 3 },
  { country: 'Finland', region: 'european', weight: 2 },
  { country: 'Denmark', region: 'european', weight: 2 },
  { country: 'Norway', region: 'european', weight: 2 },
  { country: 'Poland', region: 'european', weight: 2 },
  { country: 'Czech Republic', region: 'european', weight: 2 },
  { country: 'Portugal', region: 'european', weight: 2 },
  { country: 'Hungary', region: 'european', weight: 1 },
  { country: 'Greece', region: 'european', weight: 1 },
  // Asian
  { country: 'Japan', region: 'asian', weight: 8 },
  { country: 'China', region: 'asian', weight: 3 },
  { country: 'South Korea', region: 'asian', weight: 2 },
  { country: 'India', region: 'asian', weight: 3 },
  // American
  { country: 'United States', region: 'american', weight: 10 },
  { country: 'Canada', region: 'american', weight: 3 },
  { country: 'Australia', region: 'european', weight: 4 },
  // Brazilian
  { country: 'Brazil', region: 'brazilian', weight: 6 },
  { country: 'Argentina', region: 'brazilian', weight: 2 },
  { country: 'Mexico', region: 'american', weight: 2 },
  // African
  { country: 'South Africa', region: 'african', weight: 2 },
  { country: 'Nigeria', region: 'african', weight: 1 },
  { country: 'Kenya', region: 'african', weight: 1 },
  // Middle Eastern
  { country: 'United Arab Emirates', region: 'middle_eastern', weight: 2 },
  { country: 'Saudi Arabia', region: 'middle_eastern', weight: 1 },
  { country: 'Turkey', region: 'middle_eastern', weight: 2 },
  { country: 'Iran', region: 'middle_eastern', weight: 1 },
]

// ============================================
// NAME GENERATION UTILITIES
// ============================================

/**
 * Pick a weighted-random nationality
 */
export function pickNationality(): NationalityConfig {
  const totalWeight = NATIONALITIES.reduce((sum, n) => sum + n.weight, 0)
  let roll = Math.random() * totalWeight
  for (const nat of NATIONALITIES) {
    roll -= nat.weight
    if (roll <= 0) return nat
  }
  return NATIONALITIES[0]
}

/**
 * Pick a random gender with configurable weight (default 75% male)
 */
export function pickGender(maleProbability: number = 0.75): StaffGender {
  return Math.random() < maleProbability ? 'male' : 'female'
}

/**
 * Generate a gendered, region-appropriate name
 */
export function generateStaffName(gender: StaffGender, region: NameRegion): { firstName: string; lastName: string } {
  const firstNamePool = gender === 'male' ? MALE_FIRST_NAMES[region] : FEMALE_FIRST_NAMES[region]
  const lastNamePool = LAST_NAMES[region]

  const firstName = firstNamePool[Math.floor(Math.random() * firstNamePool.length)]
  const lastName = lastNamePool[Math.floor(Math.random() * lastNamePool.length)]

  return { firstName, lastName }
}

/**
 * Deterministic hash for seeded selection (e.g. portrait assignment)
 */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Try to infer gender from a first name by checking name pools.
 * Returns 'male' if found in male pools, 'female' if found in female pools.
 * Falls back to 'male' if not found (matches the 75% male default).
 */
export function inferGenderFromName(firstName: string): StaffGender {
  const lowerFirst = firstName.toLowerCase()

  for (const region of Object.keys(MALE_FIRST_NAMES) as NameRegion[]) {
    if (MALE_FIRST_NAMES[region].some(n => n.toLowerCase() === lowerFirst)) {
      return 'male'
    }
  }

  for (const region of Object.keys(FEMALE_FIRST_NAMES) as NameRegion[]) {
    if (FEMALE_FIRST_NAMES[region].some(n => n.toLowerCase() === lowerFirst)) {
      return 'female'
    }
  }

  // Default to male (matches the 75% weighting)
  return 'male'
}
