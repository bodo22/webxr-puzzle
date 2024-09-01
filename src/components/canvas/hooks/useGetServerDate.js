import React from "react";

let currOffset = 0;

(async () => {
  // setInterval(async () => {
  setInterval(async () => {
    const { offset, /* date, uncertainty */ } = await getServerDate();
    // console.log("server", { date, offset, uncertainty });
    // some time in the future
    // const serverDate = new Date();
    currOffset = offset;
  }, 1000);
})();

export function getServerDateNow() {
  return Date.now() + currOffset;
}

export default function useGetServerDateNow() {
  return React.useCallback(getServerDateNow, []);
}

// based on import { getServerDate } from "@nodeguy/server-date";
// with custom Date-now header for millisecond precision, instead of second-precision
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const fetchSampleImplementation = async () => {
  const requestDate = Date.now();

  const { headers, ok, statusText } = await fetch(window.location, {
    cache: `no-store`,
    method: `HEAD`,
  });

  if (!ok) {
    throw new Error(`Bad date sample from server: ${statusText}`);
  }

  return {
    requestDate,
    responseDate: Date.now(),
    serverDate: headers.get(`Date-now`),
  };
};

export const getServerDate = async (
  { fetchSample } = { fetchSample: fetchSampleImplementation }
) => {
  let best = { uncertainty: Number.MAX_VALUE };

  // Fetch 10 samples to increase the chance of getting one with low
  // uncertainty.
  for (let index = 0; index < 10; index++) {
    try {
      const { requestDate, responseDate, serverDate } = await fetchSample();

      const uncertainty = (responseDate - requestDate) / 2;

      if (uncertainty < best.uncertainty) {
        const date = serverDate;

        best = {
          date,
          offset: date - responseDate,
          uncertainty,
        };
      }
    } catch (exception) {
      console.warn(exception);
    }
  }

  return best;
};
