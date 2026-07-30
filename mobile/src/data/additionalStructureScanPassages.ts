import type { StructureScanRound } from './structureScanPassages';

/**
 * Original practical documents for heading-led information retrieval.
 * Every document has five distinct sections so all difficulty levels can draw
 * a complete answer-preserving subset.
 */
export const ADDITIONAL_STRUCTURE_SCAN_ROUNDS: readonly StructureScanRound[] = [
  {
    id: 'bike-share-guide',
    title: 'Using the city bike-share service',
    goal: 'Find what to do when a rented bicycle develops a mechanical problem.',
    sections: [
      {
        heading: 'Buying a pass',
        body: 'Day passes are available in the mobile app and at station kiosks. Monthly passes require a verified account.',
      },
      {
        heading: 'Unlocking a bicycle',
        body: 'Scan the frame code or enter its five-digit number, then wait for the dock light to turn green.',
      },
      {
        heading: 'Mechanical problems',
        body: 'Stop riding an unsafe bicycle, return it to the nearest dock, press the repair button, and report the fault in the app.',
      },
      {
        heading: 'Pausing a journey',
        body: 'A cable lock may be used only at marked pause points. Paused time remains part of the rental charge.',
      },
      {
        heading: 'Ending the rental',
        body: 'Push the bicycle firmly into a dock and confirm that the app shows the trip as complete before leaving.',
      },
    ],
    correctHeading: 'Mechanical problems',
    evidence:
      'The mechanical-problems section says to stop, dock the bicycle, mark it for repair, and report the fault.',
  },
  {
    id: 'theater-visit',
    title: 'Planning an evening at the theater',
    goal: 'Find whether a late audience member can enter after the performance begins.',
    sections: [
      {
        heading: 'Ticket collection',
        body: 'Digital tickets appear in the booking account. Printed tickets can be collected from the desk with photo identification.',
      },
      {
        heading: 'Late admission',
        body: 'Latecomers enter only during a suitable pause chosen by the production team and may be seated in an alternate area.',
      },
      {
        heading: 'Accessible seating',
        body: 'Wheelchair spaces, companion seats, and step-free routes can be requested by telephone before the visit.',
      },
      {
        heading: 'Coat storage',
        body: 'Large bags must be left at the staffed cloakroom. Small personal items may be taken to the seat.',
      },
      {
        heading: 'After the show',
        body: 'The café remains open for thirty minutes, and the final bus departure is displayed beside the main exit.',
      },
    ],
    correctHeading: 'Late admission',
    evidence:
      'The late-admission section explains that entry waits for an approved pause and may use different seating.',
  },
  {
    id: 'home-energy-audit',
    title: 'Preparing for a home energy audit',
    goal: 'Find how the auditor will check for unwanted air leaks.',
    sections: [
      {
        heading: 'Before the appointment',
        body: 'Move stored items away from the boiler, attic hatch, and main utility meters so they can be reached safely.',
      },
      {
        heading: 'Heating records',
        body: 'If available, provide one year of energy bills so seasonal use can be compared with the building inspection.',
      },
      {
        heading: 'Air-leak test',
        body: 'The auditor may place a temporary fan in an outside doorway and use the pressure difference to locate drafts around gaps.',
      },
      {
        heading: 'Insulation review',
        body: 'Visible insulation in the roof and accessible walls is checked for depth, coverage, moisture, and damaged areas.',
      },
      {
        heading: 'Receiving the report',
        body: 'The report ranks suggested repairs by likely savings, estimated cost, and whether specialist work is required.',
      },
    ],
    correctHeading: 'Air-leak test',
    evidence:
      'That section describes a temporary doorway fan and pressure difference used to locate drafts.',
  },
  {
    id: 'school-trip',
    title: 'School field-trip information',
    goal: 'Find how families should provide details about a student’s medicine.',
    sections: [
      {
        heading: 'Permission deadline',
        body: 'The signed permission form and trip payment must reach the school office by the posted Friday deadline.',
      },
      {
        heading: 'Medical information',
        body: 'List current medicine on the health form and give labeled doses to the school nurse on the morning of departure.',
      },
      {
        heading: 'Clothing',
        body: 'Students need closed shoes, a waterproof outer layer, and a spare pair of dry socks.',
      },
      {
        heading: 'Lunch arrangements',
        body: 'Bring a nut-free packed lunch in a reusable bag. Drinking water will be refilled at the visitor center.',
      },
      {
        heading: 'Return updates',
        body: 'If traffic changes the arrival time by more than fifteen minutes, families receive a message through the school app.',
      },
    ],
    correctHeading: 'Medical information',
    evidence:
      'The medical-information section gives both the health-form requirement and the labeled-dose handoff.',
  },
  {
    id: 'makerspace-membership',
    title: 'Community makerspace handbook',
    goal: 'Find when a member may use the laser cutter without direct supervision.',
    sections: [
      {
        heading: 'Joining the space',
        body: 'New members complete an orientation covering emergency exits, shared storage, and the booking system.',
      },
      {
        heading: 'Laser-cutter access',
        body: 'Members may work independently only after completing the machine class and a supervised practical assessment.',
      },
      {
        heading: 'Material rules',
        body: 'Only materials on the approved list may be cut. Unknown plastics must be checked by a technician first.',
      },
      {
        heading: 'Project storage',
        body: 'Label projects with a name and removal date. Unlabeled work is moved to the weekly collection shelf.',
      },
      {
        heading: 'Reporting damage',
        body: 'Stop using damaged equipment, disconnect it when safe, and attach an out-of-service label before contacting staff.',
      },
    ],
    correctHeading: 'Laser-cutter access',
    evidence:
      'The access section requires both the class and supervised assessment before independent use.',
  },
  {
    id: 'harbor-ferry',
    title: 'Harbor ferry passenger guide',
    goal: 'Find whether a bicycle needs a separate reservation.',
    sections: [
      {
        heading: 'Passenger tickets',
        body: 'Single and return fares can be bought online or at the terminal until ten minutes before departure.',
      },
      {
        heading: 'Traveling with bicycles',
        body: 'Bicycle spaces are limited and must be reserved at no extra charge when the passenger ticket is booked.',
      },
      {
        heading: 'Boarding time',
        body: 'Foot passengers should arrive fifteen minutes early; passengers needing boarding assistance should allow thirty minutes.',
      },
      {
        heading: 'Weather disruption',
        body: 'Strong winds may delay or cancel sailings. Updates appear on terminal screens and the service-status page.',
      },
      {
        heading: 'Items left aboard',
        body: 'Lost property is held at the east terminal for twenty-eight days after it is recorded by the crew.',
      },
    ],
    correctHeading: 'Traveling with bicycles',
    evidence:
      'The bicycle section says the free but limited space must be reserved with the passenger ticket.',
  },
  {
    id: 'allotment-rules',
    title: 'Allotment garden handbook',
    goal: 'Find whether rainwater barrels are allowed beside a garden shed.',
    sections: [
      {
        heading: 'Annual fees',
        body: 'Plot fees are due each April and cover shared water points, path maintenance, and green-waste collection.',
      },
      {
        heading: 'Sheds and water storage',
        body: 'One small shed and up to two covered rain barrels are permitted if they remain within the marked plot boundary.',
      },
      {
        heading: 'Accepted plants',
        body: 'Fruit, vegetables, flowers, and compact shrubs are welcome. Invasive plants listed by the council are prohibited.',
      },
      {
        heading: 'Shared paths',
        body: 'Keep the path beside the plot clear of tools, hoses, trailing plants, and stored building materials.',
      },
      {
        heading: 'Ending a tenancy',
        body: 'Remove personal structures and waste before returning the gate key at the end of the rental period.',
      },
    ],
    correctHeading: 'Sheds and water storage',
    evidence:
      'That section permits up to two covered rain barrels when they stay inside the plot.',
  },
  {
    id: 'language-course',
    title: 'Evening language-course guide',
    goal: 'Find how a learner can move to a different class level.',
    sections: [
      {
        heading: 'Placement check',
        body: 'New learners complete a short online activity before choosing a class, unless they are absolute beginners.',
      },
      {
        heading: 'Changing levels',
        body: 'Speak with the instructor during the first two weeks; a move is arranged if another level better matches current skills.',
      },
      {
        heading: 'Course materials',
        body: 'Digital exercises are included. The optional printed workbook can be ordered during registration.',
      },
      {
        heading: 'Attendance',
        body: 'Learners who miss a class can review the lesson outline but cannot transfer the unused session to another term.',
      },
      {
        heading: 'Completion record',
        body: 'A digital record is issued after the final task to learners who attended at least three quarters of the classes.',
      },
    ],
    correctHeading: 'Changing levels',
    evidence:
      'The changing-levels section directs learners to the instructor and sets a two-week window.',
  },
  {
    id: 'repair-warranty',
    title: 'Electronics repair warranty',
    goal: 'Find whether damage caused by a new liquid spill is covered after repair.',
    sections: [
      {
        heading: 'Warranty period',
        body: 'Replaced parts and completed labor are covered for ninety days from the collection date shown on the receipt.',
      },
      {
        heading: 'What is covered',
        body: 'Coverage applies when the repaired fault returns or a fitted part fails during ordinary use.',
      },
      {
        heading: 'What is excluded',
        body: 'New impact, liquid damage, unauthorized changes, and faults unrelated to the original repair are not covered.',
      },
      {
        heading: 'Requesting a review',
        body: 'Bring the device, repair receipt, and all supplied accessories to the service desk for an initial inspection.',
      },
      {
        heading: 'Data responsibility',
        body: 'Customers should keep a current backup because testing or replacement may require stored data to be erased.',
      },
    ],
    correctHeading: 'What is excluded',
    evidence:
      'The exclusions section explicitly lists new liquid damage as outside the repair warranty.',
  },
];
