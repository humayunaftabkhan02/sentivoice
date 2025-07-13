import React from "react";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

/**
 * ComingSoon Page
 * Renders a "Coming Soon" message between the existing Header and Footer.
 */
const ComingSoon = () => {
  return (
    <>
      <Header />
      <section className="bg-[#EBEDE9] px-8 md:px-24 lg:px-52 flex flex-col justify-center items-center h-screen">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#242424]">
          Coming Soon
        </h1>
      </section>
      <Footer />
    </>
  );
};

export default ComingSoon;