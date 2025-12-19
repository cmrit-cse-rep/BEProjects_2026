import dynamic from 'next/dynamic'
import Head from 'next/head'
import UIOverlay from '../components/UIOverlay'

const GardenScene = dynamic(() => import('../components/GardenScene'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>Virtual Herbal Garden</title>
        <meta name="description" content="Virtual Herbal Garden - demo" />
      </Head>

      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <GardenScene />
        <UIOverlay />
      </div>
    </>
  )
}
