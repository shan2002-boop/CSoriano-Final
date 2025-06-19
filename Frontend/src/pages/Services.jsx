import React from 'react';
import styles from '../css/Services.module.css';
import Header from '../components/Header';

// Import images directly
import CarpentryImg from '../assets/Carpentry.jpeg';
import MasonryImg from '../assets/Masonry.jpeg';
import MetalWorksImg from '../assets/Metalworks.jpeg';
import PaintingImg from '../assets/Painting.jpeg';
import PlumbingImg from '../assets/Plumbing.jpeg';
import ElectricalImg from '../assets/Electrical.jpeg';
import AirConditioningImg from '../assets/Airconditioning.jpeg';
import LandscapingImg from '../assets/Landscaping.jpeg';

// Dummy service data
const services = [
  { id: 1, name: "Carpentry", image: CarpentryImg },
  { id: 2, name: "Masonry", image: MasonryImg },
  { id: 3, name: "Metal Works", image: MetalWorksImg },
  { id: 4, name: "Painting", image: PaintingImg },
  { id: 5, name: "Plumbing", image: PlumbingImg },
  { id: 6, name: "Electrical", image: ElectricalImg },
  { id: 7, name: "Air Conditioning", image: AirConditioningImg },
  { id: 8, name: "Landscaping", image: LandscapingImg },
];

const Services = () => {
  return (
    <>
      <Header />
      <div className={styles.servicesContainer}>
        <h1 className={styles.title}>COMPREHENSIVE SERVICES</h1>
        <h2 className={styles.subtitle}>Design and Build</h2>
  
        {/* Top Row */}
        <div className={styles.gridRow}>
          {services.slice(0, 4).map((service) => (
            <div key={service.id} className={styles.serviceCard}>
              <img
                src={service.image}
                alt={service.name}
                className={styles.serviceImage}
              />
              <p className={styles.serviceName}>{service.name}</p>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className={styles.gridRow}>
          {services.slice(4, 8).map((service) => (
            <div key={service.id} className={styles.serviceCard}>
              <img
                src={service.image}
                alt={service.name}
                className={styles.serviceImage}
              />
              <p className={styles.serviceName}>{service.name}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Services;
