import ScrollMaskReveal from "./components/ScrollMaskReveal";

const App = () => {
    return (
        <div className="relative h-screen w-full bg-[#F4F4F4] text-black font-['dmsans']">
			<div className="fixed mix-blend-difference text-white z-10 h-screen w-full top-0 left-0 flex flex-col justify-between">
				<div className="header p-8 flex justify-between items-center">
					<h4 className="text-lg cursor-pointer">logo</h4>
					<h4 className="text-lg cursor-pointer uppercase">contact</h4>
					<h4 className="text-lg cursor-pointer uppercase flex items-center gap-1.5"><div className="h-1.5 aspect-square bg-black"></div><span>menu</span></h4>
				</div>
				<div className="footer px-8 py-5 flex justify-between items-center">
					<h4 className="text-lg cursor-pointer">logo</h4>
					<h4 className="text-lg cursor-pointer uppercase">contact</h4>
					<h4 className="text-lg cursor-pointer uppercase">scroll down</h4>
				</div>
			</div>
            <ScrollMaskReveal
                videoSrc="/videos/dreamvid.mp4"
                maskSvg="/images/dreamevents.svg"
                initialMaskSize={0.8}
                targetMaskSize={35}
                easing={0.2}
                scrollHeight="500vh"
                backgroundColor="#f4f4f4"
            />
            <div className="h-screen w-full bg-zinc-900"></div>
        </div>
    );
};

export default App;
