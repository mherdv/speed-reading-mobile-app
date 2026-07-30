import type { Difficulty } from './difficultyPreferences';
import type { TextSearchVariation } from './textSearchContent';

/**
 * Original connected-text scanning passages. Each target is distributed
 * naturally across the paragraph so recognition depends on scanning rather
 * than on a repeated list or a fixed visual location.
 */
export const ADDITIONAL_TEXT_SEARCH_VARIATIONS: Record<
  Difficulty,
  readonly TextSearchVariation[]
> = {
  easy: [
    {
      id: 'easy-ticket',
      target: 'ticket',
      text: 'Nora kept her train ticket inside the front pocket of her bag. At the station gate, she showed the ticket to an attendant and checked the platform number. She kept the ticket until the journey ended, then placed the ticket in her travel notebook beside a small map.',
    },
    {
      id: 'easy-pocket',
      target: 'pocket',
      text: 'The raincoat had a deep pocket beside each button. Sami put a dry cloth in one pocket and a folded list in the other. During the walk, he found a smooth stone and slipped it into the empty pocket. At home, he checked every pocket before hanging the coat.',
    },
    {
      id: 'easy-square',
      target: 'square',
      text: 'The town square filled slowly before the evening concert. Volunteers placed chairs across the square while shopkeepers hung lights above their doors. A food cart stopped near the center of the square. When the music ended, families crossed the quiet square on their way home.',
    },
    {
      id: 'easy-kettle',
      target: 'kettle',
      text: 'A blue kettle rested on the stove in the small cabin. Imani filled the kettle at the sink and listened as the water warmed. When the kettle began to whistle, she poured tea for the hikers. After breakfast, the clean kettle returned to its shelf.',
    },
    {
      id: 'easy-picnic',
      target: 'picnic',
      text: 'The class planned a picnic beside the orchard after its nature walk. Each student carried one item for the picnic, and the teacher brought a large blanket. Wind moved the picnic to a sheltered field. Before leaving, everyone checked the picnic area for litter.',
    },
    {
      id: 'easy-workshop',
      target: 'workshop',
      text: 'The school workshop opens every Thursday after lessons. In the workshop, students repair stools, paint signs, and learn to use simple tools safely. A volunteer checks each project before it leaves the workshop. At closing time, the workshop floor is swept and every tool returns to its place.',
    },
  ],
  medium: [
    {
      id: 'medium-archive',
      target: 'archive',
      text: 'The town archive received a box of photographs without dates or names. A volunteer searched the archive for matching street plans, while another compared shop signs in the images. Notes from the archive helped identify two locations but not the year. Staff added the uncertain photographs to the archive with clear labels describing what remained unknown.',
    },
    {
      id: 'medium-estimate',
      target: 'estimate',
      text: 'Engineers prepared an estimate for repairing the footbridge after the winter flood. The first estimate assumed that the stone supports were sound, but an inspection revealed hidden cracks. A revised estimate included the extra masonry and a wider range for material prices. Publishing each estimate with its assumptions helped residents understand why the expected cost had changed.',
    },
    {
      id: 'medium-boundary',
      target: 'boundary',
      text: 'The habitat survey used a stream as the northern boundary of its study area. Birds seen just beyond the boundary were recorded separately rather than mixed with the main count. After heavy rain altered the stream channel, researchers marked the original boundary on their map. Keeping a stable boundary made observations from different weeks easier to compare.',
    },
    {
      id: 'medium-interval',
      target: 'interval',
      text: 'The garden sensors recorded soil moisture at a regular interval throughout the day. A five-minute interval produced detailed data but drained the batteries quickly, so the team tested a longer interval. They found that a fifteen-minute interval still captured the important changes after watering. The chosen interval balanced useful detail with reliable operation.',
    },
    {
      id: 'medium-feedback',
      target: 'feedback',
      text: 'The writing group requested feedback on the clarity of its instructions. Early feedback showed that readers understood the goal but missed one safety step. The editors used that feedback to reorder two paragraphs and add a labeled diagram. A second round of feedback confirmed the improvement while identifying one term that still needed a definition.',
    },
    {
      id: 'medium-revision',
      target: 'revision',
      text: 'The first map revision added a new bus stop but accidentally removed a footpath label. During review, the team compared the revision with the previous edition and found the omission. A second revision restored the label and corrected the stop location. Recording the reason for every revision made later checks faster and more reliable.',
    },
  ],
  hard: [
    {
      id: 'hard-methodology',
      target: 'methodology',
      text: 'A result cannot be evaluated fully without understanding the methodology that produced it. The report’s methodology specified how households were sampled, how missing responses were handled, and which comparisons were planned in advance. A later team changed the methodology by recruiting only online volunteers. Because that methodology reached a different population, its similar percentage did not automatically constitute a direct replication.',
    },
    {
      id: 'hard-bias',
      target: 'bias',
      text: 'A measurement may contain bias even when every value is recorded consistently. In the transport survey, response bias arose because riders experiencing severe delays were more likely to complete the complaint form. Weighting the responses reduced one source of bias but could not reconstruct opinions from people who never received the form. The final report therefore treated residual bias as a limitation rather than claiming a perfectly representative estimate.',
    },
    {
      id: 'hard-criterion',
      target: 'criterion',
      text: 'The grant panel defined a separate criterion for feasibility, public benefit, and long-term maintenance. A proposal could satisfy one criterion strongly while performing poorly on another. Reviewers scored each criterion before discussing the overall ranking, which made disagreements easier to locate. When the budget changed, the panel revised the cost criterion openly instead of quietly applying a new standard to later applications.',
    },
    {
      id: 'hard-causality',
      target: 'causality',
      text: 'A sequence of events can suggest causality without demonstrating it. Park visits increased after new lighting was installed, yet warmer weather arrived during the same week. To investigate causality, planners compared similar parks, examined hourly patterns, and asked whether the proposed mechanism matched the observations. Their evidence strengthened the case for causality but still could not exclude every alternative influence.',
    },
    {
      id: 'hard-replication',
      target: 'replication',
      text: 'A useful replication does more than repeat the wording of an earlier report. The research team registered its measures before collecting data and used the same inclusion rules as the original study. Its replication produced a smaller effect, prompting an examination of sample differences. By publishing the full procedure, the team allowed another replication to test whether the discrepancy reflected chance, context, or method.',
    },
    {
      id: 'hard-scope',
      target: 'scope',
      text: 'The scope of a conclusion should match the people, places, and conditions represented by its evidence. A successful trial in two coastal schools may justify a claim within that scope, but not a universal rule for every school system. Expanding the scope requires additional observations across relevant settings. Careful summaries state the current scope clearly and distinguish it from the broader scope that future research might examine.',
    },
  ],
};
