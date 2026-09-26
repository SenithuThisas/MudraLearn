export interface TieredSign {
  name: string
  category: string
  has_clip: boolean
  recognizable: boolean
  recognitionSupported?: boolean
}

export type SignTier =
  | 'has_clip'
  | 'practiceable_no_clip'
  | 'clip_practice_soon'
  | 'catalogue_only'

export const SUPPORTED_SIGN_NAMES = new Set<string>([
  '1. one', '2. two', '3. three', '4. four', '5. five', '6. six', '8. eight',
  'Again', 'Allow', 'Alright', 'Also', 'April', 'Bag', 'Beautiful', 'Bed',
  'Black', 'Boat', 'Book', 'Bro', 'Camera', 'Can', 'Card', 'Cat',
  'Ceiling fan', 'Cell phone', 'Change', 'Child', 'Choice', 'Choose',
  'Clothing', 'Cold', 'Come', 'Computer', 'Cook', 'Copy', 'Cough',
  'Crocodile', 'Cry', 'Cut', 'Day', 'Deaf', 'Deep', 'Different', 'Doctor',
  'Drink', 'Eat', 'Elder bro', 'Elder sister', 'Elephant', 'Equal', 'Erase',
  'Exchange', 'Face', 'Fast', 'Fat', 'February', 'Feel', 'Fever', 'Fight',
  'Follow', 'Friday', 'Full', 'Give', 'Go', 'Good', 'Grand father', 'Green',
  'Group', 'Gun', 'Happy', 'Hard', 'Hat', 'He', 'Healthy', 'Hear', 'Hello',
  'Help', 'High', 'Hour', 'House', 'I', 'In', 'Internet', 'January', 'Key',
  'Laptop', 'List', 'Location', 'Lock', 'Look', 'Loose', 'Love', 'Low',
  'Man', 'March', 'Meet', 'Monday', 'Money', 'Mother', 'Motorcycle', 'My',
  'Near', 'November', 'October', 'Ok', 'Order', 'Paint', 'Past', 'Pencil',
  'Plane', 'Play', 'Player', 'Pocket', 'Point', 'Present', 'Problem',
  'Pull', 'Purple', 'Quick', 'Radio', 'Red', 'Rich', 'Ring', 'Road', 'Run',
  'Same', 'See', 'Sell', 'Shirt', 'Shop', 'Show', 'Sign', 'Skirt', 'Sleep',
  'Small', 'Soft', 'Son', 'Squirrel', 'Strong', 'Suit', 'Table', 'Teach',
  'Technology', 'Telephone', 'Tell', 'Thank you', 'Tight', 'Time', 'To',
  'Today', 'Tomorrow', 'Until', 'Up', 'Us', 'Vehicle', 'Visit', 'Walk',
  'Want', 'Wash', 'Watch', 'Weather', 'Wednesday', 'White', 'Window',
  'Write', 'Wrong', 'Yellow', 'Yesterday', 'You', 'Younger bro', 'Younger sister',
])

export function isRecognitionSupported(
  sign: Pick<TieredSign, 'recognizable'> & Partial<Pick<TieredSign, 'recognitionSupported'>> | string,
): boolean {
  if (typeof sign === 'string') {
    return SUPPORTED_SIGN_NAMES.has(sign)
  }
  if (typeof sign.recognitionSupported === 'boolean') {
    return sign.recognitionSupported
  }
  return Boolean(sign.recognizable)
}

export function getSignTier(
  sign: Pick<TieredSign, 'has_clip' | 'recognizable'> & Partial<Pick<TieredSign, 'recognitionSupported'>>,
): SignTier {
  const supported = isRecognitionSupported(sign)
  if (sign.has_clip && supported) return 'has_clip'
  if (supported) return 'practiceable_no_clip'
  if (sign.has_clip && !supported) return 'clip_practice_soon'
  return 'catalogue_only'
}

export const TIER_META: Record<SignTier, { label: string; badgeClass: string; practiceSupported: boolean }> = {
  has_clip: {
    label: '▶ CLIP',
    badgeClass: 'bg-sticker-mint text-ink',
    practiceSupported: true,
  },
  practiceable_no_clip: {
    label: '◐ PRACTICE',
    badgeClass: 'bg-sticker-yellow text-ink',
    practiceSupported: true,
  },
  clip_practice_soon: {
    label: '▶ CLIP · COMING SOON',
    badgeClass: 'bg-sticker-yellow/80 text-ink',
    practiceSupported: false,
  },
  catalogue_only: {
    label: '◇ COMING SOON',
    badgeClass: 'bg-hairline text-muted',
    practiceSupported: false,
  },
}
