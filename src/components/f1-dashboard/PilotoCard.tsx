import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Avatar, AvatarImage } from '../ui/Avatar';
import Image from 'next/image';

export interface PilotStats {
    id: number;
    nombre: string;
    fecha_nac: string;
    nacionalidad: string;
    img: string;
}

interface PilotCardProps {
    pilot: PilotStats;
}

const PilotCard: React.FC<PilotCardProps> = ({ pilot }) => {
    return (
        <Card className="w-full">
            <div className="relative z-0">
                <div className="relative h-44 w-full overflow-hidden rounded-t-lg">
                    <Image
                        src={pilot.img}
                        alt={pilot.nombre}
                        layout='fill'
                        objectFit='cover'
                        objectPosition='center top'
                    />
                </div>
            </div>
            <CardHeader>
                <CardTitle>{pilot.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm mt-2">{pilot.nacionalidad}</p>
            </CardContent>
        </Card>
    );
};

export default PilotCard;



// /**
//  * v0 by Vercel.
//  * @see https://v0.dev/t/UlKdUqre4H4
//  * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
//  */
// import { Card } from "@/components/ui/card"

// export default function Component() {
//   return (
//     <Card className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
//       <div className="md:flex">
//         <div className="md:flex-shrink-0">
//           <img
//             alt="Driver's Image"
//             className="h-48 w-full object-cover md:w-48"
//             height="200"
//             src="/placeholder.svg"
//             style={{
//               aspectRatio: "200/200",
//               objectFit: "cover",
//             }}
//             width="200"
//           />
//         </div>
//         <div className="p-8">
//           <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Driver's Name</div>
//           <p className="mt-2 text-gray-500">Nationality: British</p>
//           <p className="mt-2 text-gray-500">Team: Mercedes</p>
//           <p className="mt-2 text-gray-500">Number: 44</p>
//           <div className="mt-2 flex items-center text-gray-500">
//             <TrophyIcon className="h-5 w-5 text-gray-500" />
//             <p className="ml-2">Total Wins: 100</p>
//           </div>
//           <div className="mt-2 flex items-center text-gray-500">
//             <PodcastIcon className="h-5 w-5 text-gray-500" />
//             <p className="ml-2">Total Podiums: 150</p>
//           </div>
//           <div className="mt-2 flex items-center text-gray-500">
//             <FlagIcon className="h-5 w-5 text-gray-500" />
//             <p className="ml-2">Total Pole Positions: 100</p>
//           </div>
//         </div>
//       </div>
//     </Card>
//   )
// }

// function FlagIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
//       <line x1="4" x2="4" y1="22" y2="15" />
//     </svg>
//   )
// }


// function PodcastIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <circle cx="12" cy="11" r="1" />
//       <path d="M11 17a1 1 0 0 1 2 0c0 .5-.34 3-.5 4.5a.5.5 0 0 1-1 0c-.16-1.5-.5-4-.5-4.5Z" />
//       <path d="M8 14a5 5 0 1 1 8 0" />
//       <path d="M17 18.5a9 9 0 1 0-10 0" />
//     </svg>
//   )
// }


// function TrophyIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
//       <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
//       <path d="M4 22h16" />
//       <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
//       <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
//       <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
//     </svg>
//   )
// }
