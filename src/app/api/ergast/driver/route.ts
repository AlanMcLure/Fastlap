


export default async function handler(req, res) {
    const { season, round, driver } = req.query;
  
    const url = `https://ergast.com/api/f1/${season}/${round}/drivers/${driver}/laps.json`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  