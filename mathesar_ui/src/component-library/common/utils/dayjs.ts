import dayjs, { extend } from 'dayjs';
import customParsePlugin from 'dayjs/plugin/customParseFormat';
import durationPlugin from 'dayjs/plugin/duration';

extend(customParsePlugin);
extend(durationPlugin);

export default dayjs;
