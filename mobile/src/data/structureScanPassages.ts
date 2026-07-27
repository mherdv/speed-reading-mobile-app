export type StructureScanSection = {
  heading: string;
  body: string;
};

export type StructureScanRound = {
  id: string;
  title: string;
  goal: string;
  sections: readonly StructureScanSection[];
  correctHeading: string;
  evidence: string;
};

export const STRUCTURE_SCAN_ROUNDS: readonly StructureScanRound[] = [
  {
    id: 'community-garden',
    title: 'Starting a community garden',
    goal: 'Find out how new gardeners can reserve a plot.',
    sections: [
      {
        heading: 'Who can participate',
        body: 'The garden welcomes neighborhood residents, nearby students, and local volunteer groups. Children must attend with an adult.',
      },
      {
        heading: 'Plot applications',
        body: 'New gardeners submit the short online request form by March 15. If requests exceed the available plots, places are assigned by lottery.',
      },
      {
        heading: 'Shared tools',
        body: 'A locked shed contains hand tools, watering cans, and wheelbarrows. Members receive the access code during orientation.',
      },
      {
        heading: 'Watering schedule',
        body: 'Drip lines run early each morning. Gardeners may use watering cans during posted daytime hours.',
      },
      {
        heading: 'End-of-season cleanup',
        body: 'All plots must be cleared before the first weekend in November so the paths and soil can be prepared for winter.',
      },
    ],
    correctHeading: 'Plot applications',
    evidence:
      'The section says new gardeners reserve a place through the online request form, with a lottery if demand is high.',
  },
  {
    id: 'museum-visit',
    title: 'Planning a museum visit',
    goal: 'Find the quietest time for a visitor who dislikes crowds.',
    sections: [
      {
        heading: 'Opening hours',
        body: 'The museum opens from 10 a.m. to 6 p.m. Tuesday through Sunday and stays open until 9 p.m. on Friday.',
      },
      {
        heading: 'Low-sensory visits',
        body: 'The first hour on Sunday uses softer lighting and reduced audio. Attendance is capped, and advance booking is recommended.',
      },
      {
        heading: 'Getting here',
        body: 'Bus routes 4 and 18 stop outside the north entrance. Bicycle racks are available beside the café.',
      },
      {
        heading: 'Temporary exhibition',
        body: 'This month’s exhibition explores how designers reuse industrial materials in furniture and public art.',
      },
      {
        heading: 'Food and drink',
        body: 'Covered water bottles are permitted. Other food and drink must remain in the café or outdoor courtyard.',
      },
    ],
    correctHeading: 'Low-sensory visits',
    evidence:
      'That section identifies a capped-attendance hour with reduced sound and lighting.',
  },
  {
    id: 'storm-preparation',
    title: 'Preparing for a winter storm',
    goal: 'Find what to do if the household loses heating.',
    sections: [
      {
        heading: 'Before the forecast',
        body: 'Check flashlights, charge power banks, and keep several days of food that does not need cooking.',
      },
      {
        heading: 'If the heat stops',
        body: 'Close unused rooms, wear loose layers, and gather in one insulated room. Never use an outdoor grill or generator indoors.',
      },
      {
        heading: 'Protecting pipes',
        body: 'Open cabinet doors around indoor pipes and allow a small trickle of water during severe cold.',
      },
      {
        heading: 'Driving conditions',
        body: 'Avoid unnecessary trips. If travel is essential, share the route and expected arrival time with another person.',
      },
      {
        heading: 'After the storm',
        body: 'Check for damaged branches and report fallen power lines from a safe distance.',
      },
    ],
    correctHeading: 'If the heat stops',
    evidence:
      'The section gives safe actions for conserving warmth and warns against indoor combustion.',
  },
  {
    id: 'library-membership',
    title: 'Using the city library',
    goal: 'Find how long an adult may keep a newly released book.',
    sections: [
      {
        heading: 'Getting a card',
        body: 'Residents can apply online and show proof of address on their first visit. The card is free.',
      },
      {
        heading: 'Loan periods',
        body: 'Most books may be borrowed for three weeks. New releases have a two-week loan and cannot be renewed while another reader is waiting.',
      },
      {
        heading: 'Digital collection',
        body: 'Members can borrow ebooks, audiobooks, newspapers, and research databases with their card number.',
      },
      {
        heading: 'Study spaces',
        body: 'Small rooms can be booked for up to two hours. Open desks do not require a reservation.',
      },
      {
        heading: 'Returning items',
        body: 'Books can be returned at any branch or through an outdoor return slot after closing.',
      },
    ],
    correctHeading: 'Loan periods',
    evidence:
      'The loan-period section says a new release may be kept for two weeks.',
  },
  {
    id: 'trail-guide',
    title: 'Lakeside trail guide',
    goal: 'Find whether the route is suitable after heavy rain.',
    sections: [
      {
        heading: 'Route overview',
        body: 'The loop is six kilometers long and usually takes about ninety minutes at a relaxed walking pace.',
      },
      {
        heading: 'Surface and weather',
        body: 'Most of the route is compacted soil. Two low sections become muddy and may close temporarily after heavy rain.',
      },
      {
        heading: 'Wildlife',
        body: 'Water birds nest near the eastern shore. Keep dogs on a short lead and remain on marked paths.',
      },
      {
        heading: 'Facilities',
        body: 'Drinking water and restrooms are available beside the visitor center at the trail entrance.',
      },
      {
        heading: 'Accessibility',
        body: 'The first kilometer has a firm, step-free surface. Benches are placed roughly every two hundred meters.',
      },
    ],
    correctHeading: 'Surface and weather',
    evidence:
      'The surface-and-weather section warns that muddy low areas may close after heavy rain.',
  },
  {
    id: 'course-enrollment',
    title: 'Evening language course',
    goal: 'Find whether a learner can receive a refund after classes begin.',
    sections: [
      { heading: 'Course levels', body: 'A short placement task assigns learners to beginner, intermediate, or advanced groups.' },
      { heading: 'Refund policy', body: 'A full refund is available before the first class. During the first week, half the fee can be refunded; later withdrawals are not refundable.' },
      { heading: 'Class schedule', body: 'Groups meet on Tuesday and Thursday evenings for ten weeks.' },
      { heading: 'Learning materials', body: 'Digital exercises are included. Learners may buy an optional printed workbook.' },
      { heading: 'Certificates', body: 'Learners attending at least eighty percent of sessions receive a completion certificate.' },
    ],
    correctHeading: 'Refund policy',
    evidence: 'The refund section explains the reduced refund available during the first week.',
  },
  {
    id: 'train-ticket',
    title: 'Regional train tickets',
    goal: 'Find whether a discounted ticket can be changed to another departure.',
    sections: [
      { heading: 'Ticket types', body: 'Flexible, standard, and advance-discount tickets are available on most routes.' },
      { heading: 'Changes and cancellations', body: 'Flexible tickets can be changed without a fee. Advance-discount tickets are tied to one departure and cannot be changed or refunded.' },
      { heading: 'Seat reservations', body: 'A seat can be reserved free of charge on journeys longer than one hour.' },
      { heading: 'Traveling with bicycles', body: 'Bicycle spaces are limited and require a separate reservation.' },
      { heading: 'Mobile tickets', body: 'Mobile tickets must be downloaded before boarding in areas with weak network coverage.' },
    ],
    correctHeading: 'Changes and cancellations',
    evidence: 'That section says advance-discount tickets cannot be moved to another departure.',
  },
  {
    id: 'clinic-appointment',
    title: 'Preparing for a clinic appointment',
    goal: 'Find what a patient should bring for a medication review.',
    sections: [
      { heading: 'Arrival time', body: 'Patients should arrive ten minutes early to confirm contact details.' },
      { heading: 'What to bring', body: 'For a medication review, bring a current medicine list, including non-prescription products, and any recent test results.' },
      { heading: 'Interpreter support', body: 'Free interpreter support can be requested when the appointment is booked.' },
      { heading: 'Changing an appointment', body: 'Use the patient portal or call reception at least one business day in advance.' },
      { heading: 'After the visit', body: 'A visit summary will appear in the patient portal within two business days.' },
    ],
    correctHeading: 'What to bring',
    evidence: 'The section lists the medicine list and recent test results needed for the review.',
  },
  {
    id: 'apartment-recycling',
    title: 'Apartment recycling guide',
    goal: 'Find how to dispose of a broken rechargeable battery.',
    sections: [
      { heading: 'Paper and cardboard', body: 'Flatten boxes and keep paper dry before placing it in the blue container.' },
      { heading: 'Batteries and electronics', body: 'Rechargeable batteries and damaged electronics must go to the staffed collection point, not household bins.' },
      { heading: 'Glass containers', body: 'Rinse bottles and jars, remove lids, and sort them by color where requested.' },
      { heading: 'Food waste', body: 'Use the compostable liners supplied by the building manager.' },
      { heading: 'Collection days', body: 'General waste is collected Monday; recycling is collected Thursday.' },
    ],
    correctHeading: 'Batteries and electronics',
    evidence: 'That section directs broken rechargeable batteries to the staffed collection point.',
  },
  {
    id: 'conference-guide',
    title: 'Community technology conference',
    goal: 'Find how an attendee can request live captioning.',
    sections: [
      { heading: 'Registration', body: 'Online registration closes three days before the event; walk-in places may be limited.' },
      { heading: 'Accessibility requests', body: 'Request live captioning, step-free seating, or a hearing loop through the registration form at least one week ahead.' },
      { heading: 'Workshop rooms', body: 'Room assignments appear in the event app on the morning of the conference.' },
      { heading: 'Lunch', body: 'A vegetarian lunch is included. Other dietary needs must be entered during registration.' },
      { heading: 'Recordings', body: 'Speakers may choose to share recordings after the event.' },
    ],
    correctHeading: 'Accessibility requests',
    evidence: 'The accessibility section gives the form and one-week deadline for live captioning.',
  },
  {
    id: 'pool-rules',
    title: 'Public swimming pool guide',
    goal: 'Find whether a child who cannot swim may use the deep pool.',
    sections: [
      { heading: 'Opening times', body: 'Lane swimming begins at 6 a.m.; family sessions start at 10 a.m.' },
      { heading: 'Child supervision', body: 'Children who cannot swim must remain in the shallow pool within arm’s reach of an adult.' },
      { heading: 'Changing rooms', body: 'Family and accessible changing rooms are beside the main reception desk.' },
      { heading: 'Training equipment', body: 'Kickboards may be borrowed. Personal inflatables are not permitted.' },
      { heading: 'Water quality', body: 'Water checks are completed throughout the day and recorded at reception.' },
    ],
    correctHeading: 'Child supervision',
    evidence: 'The supervision section restricts non-swimmers to the shallow pool with an adult nearby.',
  },
  {
    id: 'remote-work',
    title: 'Remote-work equipment policy',
    goal: 'Find who pays for replacing a damaged company laptop.',
    sections: [
      { heading: 'Eligible equipment', body: 'Employees may receive a laptop, monitor, keyboard, and headset based on their role.' },
      { heading: 'Damage and replacement', body: 'Report damage to IT immediately. The company covers accidental damage; deliberate damage or repeated negligence may be charged to the employee.' },
      { heading: 'Home internet', body: 'Employees are responsible for maintaining a reliable home internet connection.' },
      { heading: 'Returning equipment', body: 'All assigned devices must be returned within five business days after employment ends.' },
      { heading: 'Security updates', body: 'Company devices install required security updates automatically.' },
    ],
    correctHeading: 'Damage and replacement',
    evidence: 'That section distinguishes company-covered accidental damage from chargeable negligence.',
  },
  {
    id: 'market-stall',
    title: 'Weekend market stall guide',
    goal: 'Find whether a seller may prepare hot food at the stall.',
    sections: [
      { heading: 'Applications', body: 'Sellers submit product photos and proof of insurance with the monthly application.' },
      { heading: 'Food preparation', body: 'Hot food may be prepared only in inspected stalls with a hand-washing unit and prior written approval.' },
      { heading: 'Arrival and setup', body: 'Vehicles may enter the square from 6:30 to 7:30 a.m. and must leave before customers arrive.' },
      { heading: 'Signs and prices', body: 'Every product must have a visible price, and business names must appear on the front of each stall.' },
      { heading: 'Waste', body: 'Sellers remove their own waste and leave the pitch swept at closing time.' },
    ],
    correctHeading: 'Food preparation',
    evidence: 'The food-preparation section permits hot cooking only with inspection, equipment, and approval.',
  },
  {
    id: 'park-volunteer',
    title: 'Park volunteer day',
    goal: 'Find what happens if heavy rain is forecast.',
    sections: [
      { heading: 'Meeting point', body: 'Volunteers meet beside the east gate information board at 8:45 a.m.' },
      { heading: 'Weather plan', body: 'Light rain activities continue. If heavy rain or lightning is forecast, organizers email a cancellation notice by 7 a.m.' },
      { heading: 'What to wear', body: 'Wear closed shoes, long trousers, and clothing suitable for changing weather.' },
      { heading: 'Tools', body: 'Gloves and tools are supplied and must be returned before volunteers leave.' },
      { heading: 'Refreshments', body: 'Water and fruit are available, but volunteers should bring their own lunch.' },
    ],
    correctHeading: 'Weather plan',
    evidence: 'The weather section explains the 7 a.m. email cancellation for heavy rain or lightning.',
  },
  {
    id: 'parcel-locker',
    title: 'Using a parcel locker',
    goal: 'Find what to do when the collection code has expired.',
    sections: [
      { heading: 'Delivery notification', body: 'A message is sent when the parcel is ready, along with the locker address and collection code.' },
      { heading: 'Expired codes', body: 'Use the delivery page to request one replacement code. If that code expires, contact support before visiting the locker.' },
      { heading: 'Locker access', body: 'Enter the code on the screen, then open the highlighted compartment.' },
      { heading: 'Collection window', body: 'Parcels remain in the locker for three days before being returned to the depot.' },
      { heading: 'Accessibility', body: 'The delivery page allows customers to request a compartment between knee and shoulder height.' },
    ],
    correctHeading: 'Expired codes',
    evidence: 'That section explains how to request a replacement and when support is required.',
  },
];
