import React from 'react';

const developers = [
  { name: 'Harsh Raj Singh', image: '/Harsh_dev.jpeg', position: 'center 10%' },
  { name: 'Sharad Kumar', image: '/Sharad_dev.jpeg', position: 'center 30%' },
  { name: 'Sumit Kumar', image: '/sumit_dev.jpg', position: 'center 15%' },
  { name: 'Ayushi Dubey', image: '/Ayushi_dev.jpeg', position: 'center 10%' },
  { name: 'Dolly', image: '/Doly_dev.jpeg', position: 'center 15%' },
  { name: 'Nitin Khulbe', image: '/Nitin_dev.jpeg', position: 'center 20%' },
  { name: 'Vaibhav', image: '/vaibhav_dev.jpeg', position: 'center 25%' }
];

export default function MeetTheDevsPage() {
  return (
    <section className="devs-page">
      <div className="devs-container">
        <div className="devs-header">
          <h1 className="devs-title">Meet the Developers</h1>
          <p className="devs-subtitle">
            The talented team behind AERODROME's flight pricing intelligence.
          </p>
        </div>
        
        <div className="devs-grid">
          {developers.map((dev, index) => (
            <div key={index} className="dev-card">
              <div className="dev-image-wrapper">
                <img src={dev.image} alt={`${dev.name}`} className="dev-image" style={{ objectPosition: dev.position || 'center' }} />
              </div>
              <h3 className="dev-name">{dev.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
