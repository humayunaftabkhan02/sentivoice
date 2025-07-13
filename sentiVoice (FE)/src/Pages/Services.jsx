import React from 'react'
import Header from '../Components/Header/Header'
import Banner from '../Components/Banner/Banner'
import OurServices from '../Components/OurServices/OurServices'
import Footer from '../Components/Footer/Footer'

const Website = () => {
    return (
        <>
            <Header />
            <OurServices backgroundClass="bg-[#EBEDE9]" />
            <Footer/>
        </>
    )
}

export default Website