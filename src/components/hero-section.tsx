"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";

import Container from "./container";
import { Button } from "./ui/button";

import React from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Star, ChevronRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { ButtonLink } from "./common/button-link";
import { MediaList } from "@/types/miruro-api";
import { Badge } from "./ui/badge";

type IHeroSectionProps = {
  spotlightAnime: MediaList[];
  isDataLoading: boolean;
};

const HeroSection = (props: IHeroSectionProps) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected,setSelected] = React.useState(0);
  const [paused,setPaused] = React.useState(false);
  const [hover,setHover] = React.useState(false);
  const [focus,setFocus] = React.useState(false);
  const [drag,setDrag] = React.useState(false);
  const [visible,setVisible] = React.useState(true);
  const [reduced,setReduced] = React.useState(false);
  const [restart,setRestart] = React.useState(0);
  const root = React.useRef<HTMLDivElement>(null);
  const count=props.spotlightAnime?.length || 0;
  React.useEffect(()=>{
    if(!api)return;
    const select=()=>{setSelected(api.selectedScrollSnap());setRestart(n=>n+1);};
    const down=()=>setDrag(true);
    const up=()=>{setDrag(false);setRestart(n=>n+1);};
    select();api.on("select",select);api.on("reInit",select);api.on("pointerDown",down);api.on("pointerUp",up);
    return()=>{api.off("select",select);api.off("reInit",select);api.off("pointerDown",down);api.off("pointerUp",up);};
  },[api]);
  React.useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setReduced(media.matches||document.documentElement.classList.contains("yuuz-reduced"));
    sync();media.addEventListener("change",sync);
    const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
    return()=>{observer.disconnect();media.removeEventListener("change",sync);};
  },[]);
  React.useEffect(()=>{
    if(!root.current)return;
    let onScreen=true;
    const sync=()=>setVisible(onScreen&&!document.hidden);
    const observer=new IntersectionObserver(([entry])=>{onScreen=entry.isIntersecting;sync();},{threshold:0.15});
    observer.observe(root.current);document.addEventListener("visibilitychange",sync);sync();
    return()=>{observer.disconnect();document.removeEventListener("visibilitychange",sync);};
  },[props.isDataLoading,count]);
  const running=!!api&&count>1&&!paused&&!hover&&!focus&&!drag&&visible&&!reduced;
  React.useEffect(()=>{
    if(!running||!api)return;
    const timer=window.setTimeout(()=>api.scrollNext(),6500);
    return()=>window.clearTimeout(timer);
  },[api,running,selected,restart]);
  if(props.isDataLoading)return <LoadingSkeleton/>;
  if(!count)return <div className="yuuz-hero grid place-items-center text-sm text-neutral-400">Banner belum tersedia.</div>;
  const move=(index:number)=>{api?.scrollTo(index,reduced);setRestart(n=>n+1);};
  return (
    <div ref={root} className="yuuz-hero" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocus(false);}}>
      <Carousel className="w-full" setApi={setApi} opts={{loop:count>1,duration:26}} aria-label="Anime pilihan">
        <CarouselContent className="!ml-0">
          {props.spotlightAnime.map((anime,index)=>(
            <CarouselItem className="!pl-0" key={anime.id||index}>
              <HeroCarouselItem anime={anime} active={index===selected} motion={!reduced&&visible}/>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="yuuz-hero-controls">
        <div className="yuuz-hero-dots" aria-label="Pilih slide">
          {props.spotlightAnime.map((anime,index)=><button key={anime.id||index} type="button" aria-label={"Slide "+(index+1)} aria-current={index===selected?"true":undefined} className={"yuuz-hero-dot"+(index===selected?" selected":"")} onClick={()=>move(index)}>
            {index===selected&&<span key={restart+":"+running} className={running?"fill running":"fill"}/>}
          </button>)}
        </div>
        <div className="yuuz-hero-arrows">
          <span className="yuuz-hero-counter">{String(selected+1).padStart(2,"0")} / {String(count).padStart(2,"0")}</span>
          <button className="yuuz-hero-control" type="button" aria-label={paused?"Jalankan autoplay":"Jeda autoplay"} disabled={count<2||reduced} onClick={()=>{setPaused(v=>!v);setRestart(n=>n+1)}}>{paused||reduced?<Play size={16}/>:<Pause size={16}/>}</button>
          <button className="yuuz-hero-control" type="button" aria-label="Slide sebelumnya" disabled={count<2} onClick={()=>{api?.scrollPrev(reduced);setRestart(n=>n+1)}}><ArrowLeft size={18}/></button>
          <button className="yuuz-hero-control" type="button" aria-label="Slide berikutnya" disabled={count<2} onClick={()=>{api?.scrollNext(reduced);setRestart(n=>n+1)}}><ArrowRight size={18}/></button>
        </div>
      </div>
    </div>
  );
};

const HeroCarouselItem = ({anime,active,motion}: {anime:MediaList;active:boolean;motion:boolean}) => {
  const bgImage =
    anime.bannerImage ||
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    "";
  const title =
    anime.title?.english || anime.title?.romaji || anime.title?.native || "Untitled";

  return (
    <div
      className={"yuuz-hero-slide"+(active?" is-active":"")+(motion?" has-motion":"")}
    >
      <div className="yuuz-hero-image" style={{backgroundImage: `url(${bgImage})`}}/>
      {/* Gradient Overlay */}
      <div className="yuuz-hero-shade"></div>
      <div className="yuuz-hero-vignette"></div>

      {/* Content Section */}
      <div className="yuuz-hero-body">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center">
          <div className="yuuz-hero-copy space-y-3 lg:w-[48vw]">
            <div className="yuuz-hero-kicker"><span/> SPOTLIGHT</div>
            <h1 className="yuuz-hero-title font-black text-white line-clamp-2">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {anime.format && (
                <Badge className="bg-[#454545] text-white font-bold">
                  {anime.format}
                </Badge>
              )}
              {anime.seasonYear && (
                <Badge variant="outline" className="text-gray-300 border-gray-600">
                  {anime.season ? `${anime.season} ` : ""}{anime.seasonYear}
                </Badge>
              )}
              {!!anime.averageScore && (
                <Badge variant="secondary" className="bg-black/50 text-white border border-white/20">
                  <Star size={12} className="fill-white"/> {anime.averageScore}% Score
                </Badge>
              )}
              {anime.genres?.slice(0, 3).map((g) => (
                <span key={g} className="text-gray-400 text-xs">
                  • {g}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-5 !mt-6">
              <ButtonLink
                href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                className="h-11 gap-2 text-sm rounded-xl bg-white text-black hover:bg-neutral-200"
              >
                Detail anime <ChevronRight size={16}/>
              </ButtonLink>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="yuuz-hero yuuz-hero-loading">
      <div className="w-full h-[calc(100%-5.25rem)] mt-[5.25rem] relative z-20">
        <Container className="w-full h-full flex flex-col justify-end md:justify-center pb-10">
          <div className="space-y-2 lg:w-[40vw]">
            <div className="h-16 animate-pulse bg-neutral-700 w-[75%]"></div>
            <div className="h-40 animate-pulse w-full bg-neutral-700"></div>
            <div className="flex items-center gap-5">
              <span className="h-10 w-[7.5rem] animate-pulse bg-neutral-700"></span>
              <span className="h-10 w-[7.5rem] animate-pulse bg-neutral-700"></span>
            </div>
          </div>
        </Container>
      </div>
      <div className="absolute hidden md:flex items-center gap-5 right-10 bottom-32 z-50 isolate">
        <span className="h-10 w-10 rounded-full animate-pulse bg-neutral-700"></span>
        <span className="h-10 w-10 rounded-full animate-pulse bg-neutral-700"></span>
      </div>
    </div>
  );
};
export default HeroSection;
