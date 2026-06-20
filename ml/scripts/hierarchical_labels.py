"""
Label-to-category mapping for hierarchical classification.
"""

NUMBERS = {
    '1. one', '2. two', '3. three', '4. four', '5. five', '6. six', '7. seven',
    '8. eight', '9. nine', '10. ten', '11. eleven', '12. twelve', '13. thirteen',
    '14. fourteen', '15. fifteen', '16. sixteen', '17. seventeen', '18. eighteen',
    '19. nineteen', '20. twenty',
}

COLORS = {
    'Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Brown',
    'Gray', 'Grey', 'Orange', 'Gold',
}

FAMILY = {
    'Mother', 'Father', 'Bro', 'Sister', 'Aunt', 'Uncle', 'Grand father',
    'Grand mother', 'Child', 'Children', 'Baby', 'Husband', 'Wife', 'Son',
    'Daughter', 'Elder bro', 'Elder sister', 'Younger bro', 'Younger sister',
    'Brother in law', 'Sister in law', 'Grand son', 'Families', 'Family',
    'Relations', 'Lady', 'Man',
}

TIME = {
    'Day', 'Night', 'Morning', 'Evening', 'Today', 'Tomorrow', 'Yesterday',
    'Week', 'Month', 'Year', 'Hour', 'Time', 'Day after tomorrow', 'Seconds',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
}

GREETINGS = {
    'Hello', 'Thank you', 'Welcome', 'Good morning', 'Good evening', 'Good night',
    'Ayubowan', 'How are you', 'Alright', 'Ok', 'Yes', 'No',
}

ACTIONS = {
    'Eat', 'Drink', 'Sleep', 'Walk', 'Run', 'Sit', 'Come', 'Go', 'Give', 'Take',
    'Bring', 'Carry', 'Put', 'Open', 'Close', 'Cover', 'Cut', 'Break', 'Cook',
    'Boil', 'Wash', 'Sweep', 'Draw', 'Write', 'Erase', 'Read', 'Listen', 'Talk',
    'Tell', 'Call', 'See', 'Look', 'Watch', 'Hear', 'Feel', 'Throw', 'Hit',
    'Push', 'Pull', 'Point', 'Show', 'Help', 'Save', 'Buy', 'Sell', 'Exchange',
    'Change', 'Choose', 'Select', 'Search', 'Play', 'Dance', 'Swim', 'Fly',
    'Travel', 'Visit', 'Meet', 'Follow', 'Lead', 'Guide', 'Learn', 'Study',
    'Teach', 'Understand', 'Think', 'Know', 'Trust', 'Love', 'Like', 'Want',
    'Try', 'Start', 'Stop', 'Work', 'Fight', 'Build', 'Make', 'Create',
    'Send', 'Receive', 'Allow', 'Enter', 'Move', 'Stay', 'Repeat', 'Practice',
    'Get up', 'Hang', 'Jump', 'Knock', 'Laugh', 'Lock', 'Scratch', 'Sell',
    'Show', 'Sit', 'Sleep', 'Smile', 'Stop', 'Sweep', 'Swim', 'Tear',
    'Throw', 'Use', 'Visit', 'Walk', 'Wash', 'Watch', 'Write', 'Click',
    'Connect', 'Copy', 'Cry', 'Divide', 'Draw', 'Drink', 'Erase', 'Give',
    'Help', 'Hit', 'Kill', 'Lead', 'Let', 'Listen', 'Lock', 'Look',
    'Make', 'Meet', 'Open', 'Paint', 'Play', 'Pull', 'Put', 'Run',
    'Sit', 'Teach', 'Think', 'Walk', 'Work', 'Bathe', 'Carry', 'Come',
    'Cough', 'Count', 'Dance', 'Eat', 'Fight', 'Follow', 'Go',
}

DESCRIPTORS = {
    'Big', 'Small', 'Hot', 'Cold', 'Fast', 'Slow', 'Hard', 'Soft', 'Strong',
    'Weak', 'Full', 'Empty', 'Clean', 'New', 'Old', 'Good', 'Bad', 'Beautiful',
    'Ugly', 'Rich', 'Poor', 'Happy', 'Sad', 'Angry', 'Calm', 'Brave', 'Kind',
    'Smart', 'Honest', 'Lazy', 'Busy', 'Free', 'Easy', 'Difficult', 'Hard',
    'Deep', 'Shallow', 'High', 'Low', 'Long', 'Short', 'Fat', 'Thin',
    'Tight', 'Loose', 'Correct', 'Wrong', 'Same', 'Different', 'Clear',
    'Deep', 'Healthy', 'Sick', 'Tired', 'Hungry', 'Thirsty', 'Positive',
    'Negative', 'Nice', 'Quick', 'Quickly', 'Clearly', 'Careful',
    'Rich', 'Senior', 'Soft', 'Strong', 'Ugly', 'Wet', 'Dry', 'Thick',
    'Heavy', 'Light', 'Wide', 'Narrow',
}

FOOD = {
    'Food', 'Milk', 'Tea',
}

ANIMALS = {
    'Cat', 'Cow', 'Elephant', 'Crocodile', 'Squirrel',
}

PLACES = {
    'House', 'Hospital', 'Airport', 'Bank', 'Bus station', 'Church', 'Temple',
    'Police station', 'Train station', 'Shop', 'Road', 'Street', 'Location',
    'Station', 'School',
}

OBJECTS = {
    'Book', 'Bag', 'Bed', 'Door', 'Window', 'Table', 'Car', 'Bus', 'Bicycle',
    'Motorcycle', 'Boat', 'Plane', 'Train', 'Van', 'Computer', 'Laptop',
    'Phone', 'Cell phone', 'Camera', 'Radio', 'Key', 'Pencil', 'Card',
    'Money', 'Ring', 'Chain', 'Flower', 'Tree', 'Hat', 'Shirt', 'Suit',
    'Clothing', 'Skirt', 'Saree', 'Pocket', 'Gun', 'Internet', 'Network',
    'Technology', 'Sign', 'Sign language', 'Vehicle', 'Television', 'Tire',
    'Umbrella', 'Clock', 'Watch', 'Paper', 'Ticket', 'Tool', 'Machine',
    'Table', 'Chair', 'Bed', 'Door',
}

BODY = {
    'Eye', 'Eyes', 'Face',
}

QUESTIONS = {
    'Who', 'Where', 'When', 'Why', 'How', 'How many', 'How much', 'Which',
    'Whose', 'Whom',
}

PRONOUNS = {
    'I', 'You', 'He', 'She', 'We', 'They', 'My', 'Our', 'Your', 'His',
    'Her', 'Their', 'Us', 'Me', 'Him',
}

FUNCTION_WORDS = {
    'In', 'On', 'To', 'For', 'With', 'About', 'Under', 'Over', 'Around',
    'Near', 'Next', 'Inside', 'Out', 'Up', 'Down', 'Before', 'After',
    'Between', 'Through', 'Into', 'Until', 'Past', 'From', 'Above',
    'Below', 'Behind', 'In front', 'And', 'But', 'Or', 'So', 'Because',
    'Although', 'If', 'Than', 'Also', 'Instead', 'Here', 'There',
    'This', 'That', 'All', 'Every', 'Some', 'Any', 'No', 'None',
    'Not', 'Never', 'Always', 'Often', 'Sometimes', 'Already', 'Yet',
    'Still', 'Just', 'Only', 'Very', 'Too', 'Enough', 'Almost', 'Nearly',
}

HEALTH = {
    'Health', 'Fever', 'Cough', 'Hospital', 'Doctor',
}

MATH = {
    'Addition', 'Subtraction', 'Multiplication', 'Divide', 'Count', 'Number',
    'Equal', 'Article', 'List', 'Group', 'Part', 'Order', 'Double',
}

MISC = {
    'Allow', 'Alright', 'Also', 'Article', 'Can', 'Cant', 'Choice', 'Color',
    'Culture', 'Done', 'Dont', 'Dont know', 'Impact', 'Independent',
    'Mind', 'Movie', 'Peace', 'Player', 'Problem', 'Seconds',
    'Society', 'Song', 'Structure', 'Team', 'Text', 'Trust', 'Weather',
}

CATEGORY_NAMES = [
    'numbers', 'colors', 'family', 'time', 'greetings', 'actions',
    'descriptors', 'food', 'animals', 'places', 'objects', 'body',
    'questions', 'pronouns', 'function_words', 'health', 'math', 'misc',
]

CATEGORY_SETS = {
    'numbers': NUMBERS,
    'colors': COLORS,
    'family': FAMILY,
    'time': TIME,
    'greetings': GREETINGS,
    'actions': ACTIONS,
    'descriptors': DESCRIPTORS,
    'food': FOOD,
    'animals': ANIMALS,
    'places': PLACES,
    'objects': OBJECTS,
    'body': BODY,
    'questions': QUESTIONS,
    'pronouns': PRONOUNS,
    'function_words': FUNCTION_WORDS,
    'health': HEALTH,
    'math': MATH,
    'misc': MISC,
}


def get_category(label_name):
    """Return the category name for a given label string."""
    for cat_name, cat_set in CATEGORY_SETS.items():
        if label_name.strip() in cat_set:
            return cat_name
    return 'misc'


def build_label_to_category(label_map):
    """
    Given a label_map dict {int_index: str_name}, return:
      - category_map: {int_index: category_name}
      - category_to_indices: {category_name: [int_index, ...]}
    """
    category_map = {}
    category_to_indices = {}

    for idx, name in label_map.items():
        cat = get_category(name)
        category_map[idx] = cat
        if cat not in category_to_indices:
            category_to_indices[cat] = []
        category_to_indices[cat].append(idx)

    return category_map, category_to_indices
