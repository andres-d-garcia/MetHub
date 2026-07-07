import { getImageFallbackSrc } from './components.js';

const buildItem = (id, title, artist, date, department, departmentId, medium, culture, classification, isHighlight = false, objectBeginDate = null, objectEndDate = null) => {
  const imageSrc = getImageFallbackSrc(title);
  return {
    objectID: id,
    title,
    artistDisplayName: artist,
    objectDate: date,
    department,
    departmentId,
    medium,
    culture,
    classification,
    isHighlight,
    objectBeginDate,
    objectEndDate,
    primaryImageSmall: imageSrc,
    primaryImage: imageSrc,
    objectURL: `https://www.metmuseum.org/art/collection/search/${id}`,
  };
};

export const LOCAL_COLLECTION = [
  buildItem(436535, 'The Starry Night', 'Vincent van Gogh', '1889', 'Paintings', 11, 'Oil on canvas', 'Dutch', 'Paintings', true, 1889, 1889),
  buildItem(437980, 'Mona Lisa', 'Leonardo da Vinci', '1503', 'European Paintings', 11, 'Oil on poplar panel', 'Italian', 'Paintings', true, 1503, 1503),
  buildItem(459055, 'The Great Wave off Kanagawa', 'Katsushika Hokusai', '1831', 'Asian Art', 21, 'Woodblock print', 'Japanese', 'Prints', true, 1831, 1831),
  buildItem(120001, 'The Dance', 'Henri Matisse', '1910', 'Modern Art', 21, 'Oil on canvas', 'French', 'Paintings', true, 1910, 1910),
  buildItem(120002, 'The Thinker', 'Auguste Rodin', '1880', 'Sculpture', 22, 'Bronze', 'French', 'Sculpture', true, 1880, 1880),
  buildItem(120003, 'The Ambassadors', 'Hans Holbein the Younger', '1533', 'European Paintings', 11, 'Oil and tempera on panel', 'German', 'Paintings', false, 1533, 1533),
  buildItem(120004, 'The Night Watch', 'Rembrandt van Rijn', '1642', 'European Paintings', 11, 'Oil on canvas', 'Dutch', 'Paintings', true, 1642, 1642),
  buildItem(120005, 'The Kiss', 'Gustav Klimt', '1907', 'Modern Art', 21, 'Oil and gold leaf', 'Austrian', 'Paintings', true, 1907, 1907),
  buildItem(120006, 'The Scream', 'Edvard Munch', '1893', 'Modern Art', 21, 'Tempera and pastels', 'Norwegian', 'Paintings', true, 1893, 1893),
  buildItem(120007, 'Venus de Milo', 'Unknown', '130 BCE', 'Sculpture', 22, 'Marble', 'Greek', 'Sculpture', false, -130, -130),
  buildItem(120008, 'Liberty Leading the People', 'Eugène Delacroix', '1830', 'Modern Art', 21, 'Oil on canvas', 'French', 'Paintings', true, 1830, 1830),
  buildItem(120009, 'The Last Supper', 'Leonardo da Vinci', '1495', 'European Paintings', 11, 'Tempera on plaster', 'Italian', 'Paintings', false, 1495, 1495),
  buildItem(120010, 'Crown of the Andes', 'Unknown', '1750', 'The American Wing', 14, 'Gold and emeralds', 'Andean', 'Metalwork', true, 1750, 1750),
  buildItem(120011, 'The Garden of Earthly Delights', 'Hieronymus Bosch', '1505', 'European Paintings', 11, 'Oil on oak panel', 'Netherlandish', 'Paintings', false, 1505, 1505),
  buildItem(120012, 'The Birth of Venus', 'Sandro Botticelli', '1484', 'European Paintings', 11, 'Tempera on canvas', 'Italian', 'Paintings', false, 1484, 1484),
  buildItem(120013, 'The Blue Dancer', 'Edgar Degas', '1898', 'Drawings and Prints', 13, 'Pastel', 'French', 'Drawings', true, 1898, 1898),
  buildItem(120014, 'The Great Wave', 'Katsushika Hokusai', '1831', 'Asian Art', 21, 'Woodblock print', 'Japanese', 'Prints', true, 1831, 1831),
  buildItem(120015, 'The Haggadah', 'Unknown', '1300', 'Islamic Art', 24, 'Illuminated manuscript', 'Jewish', 'Manuscripts', false, 1300, 1300),
  buildItem(120016, 'The Vase', 'Unknown', '1700', 'Decorative Arts', 15, 'Porcelain', 'Chinese', 'Ceramics', false, 1700, 1700),
  buildItem(120017, 'The Shield of Achilles', 'Unknown', '500 BCE', 'Greek and Roman Art', 16, 'Bronze', 'Greek', 'Metalwork', false, -500, -500),
  buildItem(120018, 'The Golden Helmet', 'Unknown', '800 BCE', 'Greek and Roman Art', 16, 'Bronze', 'Mycenaean', 'Metalwork', false, -800, -800),
  buildItem(120019, 'The Silk Scroll', 'Unknown', '1600', 'Asian Art', 21, 'Ink and silk', 'Chinese', 'Textiles', false, 1600, 1600),
  buildItem(120020, 'The Bronze Horse', 'Unknown', '1500', 'Sculpture', 22, 'Bronze', 'Renaissance', 'Sculpture', false, 1500, 1500),
];

export const LOCAL_DEPARTMENTS = [
  { departmentId: 11, displayName: 'Paintings' },
  { departmentId: 21, displayName: 'Modern Art' },
  { departmentId: 22, displayName: 'Sculpture' },
  { departmentId: 13, displayName: 'Drawings and Prints' },
  { departmentId: 14, displayName: 'The American Wing' },
  { departmentId: 15, displayName: 'Decorative Arts' },
  { departmentId: 16, displayName: 'Greek and Roman Art' },
  { departmentId: 24, displayName: 'Islamic Art' },
];
