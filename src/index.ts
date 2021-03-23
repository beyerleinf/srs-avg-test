import { promises as fs } from 'fs';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const SENSOR_ERROR = 80;

async function main() {
  const data = await loadCSV(3000);

  const cleanedData: Array<{ ts: Date; distance: number }> = [];
  let temp: Array<{ ts: Date; distance: number }> = [];
  let lastValue = 0;

  for (let i = 0; i < data.length; i++) {
    const diffToLast = Math.abs(data[i].distance - lastValue);

    if (diffToLast >= SENSOR_ERROR || i === data.length - 1) {
      const avg = temp.map(e => e.distance).reduce((acc, val) => acc + val, 0) / temp.length;

      for (const tmpValue of temp) {
        cleanedData.push({ ts: tmpValue.ts, distance: avg });
      }

      temp = [data[i]];
    } else if (diffToLast < SENSOR_ERROR) {
      temp.push(data[i]);
    }

    lastValue = data[i].distance;
  }

  await saveCSV(cleanedData);
}

async function loadCSV(limit = 100) {
  const csv = (await fs.readFile(`${__dirname}/../../data.csv`)).toString();
  const lines = csv.split('\n').slice(1);

  const data: Array<{ ts: Date; distance: number }> = [];

  let i = 0;
  for (const line of lines) {
    if (i >= limit) {
      break;
    }

    const [date, distance] = line.split(';');
    data.push({ ts: dayjs(date, 'DD.MM.YY HH:mm').toDate(), distance: Number(distance) });

    i++;
  }

  return data;
}

async function saveCSV(data: Array<{ ts: Date; distance: number }>) {
  let csv = 'Timestamp;distance\n';

  for (const d of data) {
    csv += `${dayjs(d.ts).format('DD.MM.YY HH:mm:ss')};${Math.round(d.distance * 100) / 100}\n`;
  }

  await fs.writeFile(`${__dirname}/../../new.csv`, csv);
}

main();
