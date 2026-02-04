import React from 'react';

const posters = [
  'Oppenheimer_(film).jpg',
  'Iron_Man_(2008_film)_poster.jpg',
  'Kabhi_Khushi_Kabhie_Gham..._poster.jpg',
  'Don_-_Amitabh_Bachchan_-_Hindi_Movie_Poster_-_Tallenge_Bollywood_Poster_Collection_6943c85f-e665-44f8-9e00-98ea931f00c4.jpg',
  'MV5BMTU2NjA1ODgzMF5BMl5BanBnXkFtZTgwMTM2MTI4MjE@._V1_FMjpg_UX1000_.jpg',
  'MV5BNTQzYjAzZDktMDIyOS00ODRiLWIxMjUtNmYwZjZhMGIyYTI2XkEyXkFqcGc@._V1_.jpg',
  'medium-amazing-spiderman-movie-d-on-fine-art-paper-hd-quality-original-imagcycz8ejdgkaq.webp',
  'dhurandhar-review-v0-dftsqp8m488g1.webp',
  'images.jpg',
  'images (1).jpg',
  'download.jpg',
  'download (1).jpg',
  'download (2).jpg',
  'download (3).jpg',
  'download (4).jpg',
  'download (5).jpg',
  'download (6).jpg',
  'download (7).jpg',
  'download (8).jpg',
  'download (9).jpg',
  'download (10).jpg',
];

const sizes = ['tall', 'short', '', '', 'tall', '', 'short', '', ''];

function chunk(list, cols) {
  const out = Array.from({ length: cols }, () => []);
  list.forEach((item, idx) => out[idx % cols].push(item));
  return out;
}

export default function PosterWall() {
  const columns = chunk(posters, 7);
  return (
    <div className="poster-wall" aria-hidden="true">
      {columns.map((col, cIdx) => (
        <div className="poster-col" key={`col-${cIdx}`}>
          {col.map((name, i) => {
            const size = sizes[(i + cIdx) % sizes.length];
            const src = `/posters/${encodeURIComponent(name)}`;
            return (
              <div className={`poster-card ${size}`} key={`${name}-${i}`}>
                <img src={src} alt="" loading="lazy" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
