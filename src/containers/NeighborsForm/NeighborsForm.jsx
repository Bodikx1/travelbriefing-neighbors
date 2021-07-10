import React, { useState, useEffect, useCallback } from 'react';
import './NeighborsForm.css';

export default function NeighborsForm() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [mutualNeighbors, setMutualNeighbors] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('https://travelbriefing.org/countries.json', { method: 'GET' })
        const result = await response.json();
        const selectedCountriesCount = 10;
        let randomCountries = {};

        for (let i = 0; i < result.length && Object.keys(randomCountries).length < 10; i++) {
          const randomIndex = parseInt(Math.random() * (result.length - selectedCountriesCount) + selectedCountriesCount);
          const country = result[randomIndex];
          randomCountries[country.name] = country;
        }

        if (Object.keys(randomCountries).length) {
          setSelectedCountries([...Object.values(randomCountries)]);
        }
      } catch (err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  const memoizedGenerateGroupingCallback = useCallback(
    async () => {
      const resultPromises = selectedCountries.map((selectedCountry) => {
        return new Promise((resolve) => {
          fetch(`https://travelbriefing.org/${selectedCountry.name}?format=json`, { method: 'GET' })
            .then(response => resolve(response.json()))
            .catch(err => {
              console.log(err);
              resolve(null);
            });
        });
      });
      const results = await Promise.all(resultPromises);
      const nighborsGroupings = {};

      for (let country = results[0]; results.length; country = results.pop()) {
        if (country) {
          nighborsGroupings[country.names.name] = country.neighbors.filter((neighbor) => {
            return selectedCountries.some(selectedCountry => selectedCountry.name === neighbor.name);
          });
        }
      }

      const mutualNeighborsToAdd = [];
      Object.keys(nighborsGroupings).forEach((nighborsGroupingKey) => {
        nighborsGroupings[nighborsGroupingKey].map((item) => {
          if (nighborsGroupings[item.name] && nighborsGroupings[item.name].some(relatedItem => relatedItem.name === nighborsGroupingKey)) {
            mutualNeighborsToAdd.push({ first: nighborsGroupingKey, second: item.name });
          }
        });
      });

      if (!mutualNeighborsToAdd.length) {
        alert('No neighbors found!');
      }

      setMutualNeighbors([...mutualNeighborsToAdd]);
    },
    [selectedCountries]
  );

  const neighborsTitle = mutualNeighbors.length ? 'Multiple mutual neighbors found' : 'No neighbors found:';

  return (
    <React.Fragment>
      <h3 className="neighbors-title">{neighborsTitle}</h3>
      <div className="neighbors-form">
        <button onClick={memoizedGenerateGroupingCallback}>Generate Groupings</button>
        <h3>Selected Countries</h3>
        <ul>
          {selectedCountries.map((country, index) => <li key={index}>{country.name}</li>)}
        </ul>
        <h3>Neighbors</h3>
        {mutualNeighbors.length ?
          mutualNeighbors.map((neighborsPair, index) => {
            return (
              <ul key={index}>
                <li>{neighborsPair.first}</li>
                <li>{neighborsPair.second}</li>
              </ul>
            )
          })
          : <p>No groupings found</p>}
      </div>
    </React.Fragment>
  );
}