import { AppName, getFooterItems } from "@/constants/app";
import { UsersOnlineCountLRUCache } from "@/lib/cache/LRUCaches";
import { DictionariesType } from "@/types/Dictionaries/Dictionaries.type";
import Favicon from "@/components/base/Favicon/Favicon";
import Link from "next/link";
import Badge from "@/components/base/Badge/Badge";

export default function Footer({
    dictionaries,
}: {
    dictionaries: DictionariesType;
}) {
    const footerItems = getFooterItems(dictionaries);
    const currentGitCommitHash = process.env.GIT_COMMIT_HASH;
    const totalUsersOnlineCurrently = UsersOnlineCountLRUCache.size;

    return (
        <>
            <div className="p-4 flex flex-col lg:justify-between lg:flex-row gap-4 mx-auto max-w-384 sm:py-8">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-nowrap gap-4">
                        <Favicon />
                        <div className="flex flex-col gap-1 justify-center">
                            <div className="text-xl font-medium leading-none flex items-center gap-2">
                                {AppName}{
                                    currentGitCommitHash !== undefined && (
                                        <Badge textSize="text-xs">
                                            <a
                                                className="hover:opacity-75 transition"
                                                href={`https://github.com/wahyuproject-droid/yuuzpime/tree/${currentGitCommitHash}`}
                                                target="_blank"
                                            >
                                                {currentGitCommitHash}
                                            </a>
                                        </Badge>
                                    )
                                }
                                <Badge textSize="text-xs">
                                    <span className="text-green-500 pr-1">•</span>
                                    <span>Online: {totalUsersOnlineCurrently}</span>
                                </Badge>
                            </div>
                            <Link href="/" className="w-fit text-sm leading-none text-neutral-500 dark:text-neutral-400 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200">
                                yuuzpime.vercel.app
                            </Link>
                        </div>
                    </div>
                    <div className="text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
                        {footerItems.description}
                        <div className="mt-3 text-sm">Modifikasi: YuuZGilakPrompt · <a href="https://sociabuzz.com/yuuzdisini" target="_blank" rel="noopener noreferrer" className="underline">SociaBuzz</a></div>
                        <div className="mt-1 text-xs">Based on Anisun by notwindstone · <a className="underline" href="https://github.com/wahyuproject-droid/yuuzpime/blob/anisun-yuuzpime/LICENSE">GPL-3.0</a> · No warranty</div>
                    </div>
                </div>
                <div className="flex gap-2 flex-nowrap items-start w-full lg:w-fit lg:min-w-[25%]">
                    {
                        footerItems.columns.map((column) => {
                            return (
                                <div key={column.title} className="flex-1 shrink-0 flex flex-col gap-2">
                                    <p className="text-md">
                                        {column.title}
                                    </p>
                                    {
                                        column.links?.map((link) => {
                                            return (
                                                <a
                                                    className="text-sm w-fit text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                                                    href={link.url}
                                                    target="_blank"
                                                    key={link.name}
                                                >
                                                    {link.name}
                                                </a>
                                            );
                                        })
                                    }
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </>
    );
}
