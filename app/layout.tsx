import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'The Big Dreams Avengers | Mission Control',description:'Private portfolio accountability, evidence and founder decisions.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
