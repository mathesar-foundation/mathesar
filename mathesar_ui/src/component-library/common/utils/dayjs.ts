import dayjs from 'dayjs';
import customParsePlugin from 'dayjs/plugin/customParseFormat';
import durationPlugin from 'dayjs/plugin/duration';

dayjs.extend(customParsePlugin);
dayjs.extend(durationPlugin);

export default dayjs;
