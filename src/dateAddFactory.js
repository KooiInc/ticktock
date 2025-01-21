export default dateAddFactory;

function dateAddFactory() {
  const parts = Object.entries({
    year: `FullYear`, month: `Month`, date: `Date`,
    day: `Date`, hour: `Hours`, minute: `Minutes`,
    second: `Seconds`, millisecond: `Milliseconds` })
    .reduce( (acc, [key, value]) =>
      ({...acc, [key]: value, [`${key}s`]: value}), {} );

  const aggregateArguments = function(...argsRaw) {
    const singleArgument = argsRaw.length === 1;
    let subtract = argsRaw[0].trim().startsWith(`subtract`);

    if (subtract) {
      argsRaw = singleArgument
        ? argsRaw[0].trim().replace(/^subtract./i, ``).split(`, `).map(v => v.trim())
        : argsRaw.slice(1);
    }

    if (singleArgument && !subtract) {
      argsRaw = argsRaw[0].split(`,`).map(v => v.trim());
    }

   return argsRaw
      .map(function(a) {
        if (!a) { return false; }
        return a.toLowerCase()
          .split(/ /)
          .map(v => {
            v = `${v}`.trim();
            const num = parseInt(v, 10);
            return num ? subtract ? -num : +num : v;
          });
      }).filter(v => v);
  }

  return function(date, ...args) {
    if (args.length < 1) { return date; }

    let aggregated = aggregateArguments(...args);

    if (aggregated.length) {
      aggregated.forEach( ([n, part]) => {
        part = parts[part];
        if (+n && part) {
          date[`set${part}`](date[`get${part}`]() + +n);
        }
      } );
    }

    return date;
  };
}