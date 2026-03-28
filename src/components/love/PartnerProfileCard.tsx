import { CheckCircle2, XCircle } from "lucide-react";
import { PartnerProfile } from "@/types/love";

interface PartnerProfileCardProps {
    profile: PartnerProfile;
}

export function PartnerProfileCard({ profile }: PartnerProfileCardProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <h3 className="text-[19px] font-bold text-foreground">이런 사람과 만나야 합니다</h3>
            </div>

            <div className="rounded-[28px] border border-[#24303F]/10 bg-white p-6 shadow-sm ring-1 ring-[#24303F]/5">
                <p className="text-[15px] font-medium leading-relaxed text-foreground">
                    {profile.idealDescription}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {/* Match Keywords */}
                    <div className="rounded-[20px] bg-emerald-50/50 p-5 ring-1 ring-emerald-100">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <h4 className="text-[14px] font-bold text-emerald-900">찾아야 할 특징</h4>
                        </div>
                        <ul className="mt-4 space-y-2.5">
                            {profile.matchKeywords.map((keyword, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[14px]">
                                    <span className="mt-0.5 text-[12px] font-bold text-emerald-500/50">•</span>
                                    <span className="font-semibold text-emerald-900/80">{keyword}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Avoid Keywords */}
                    <div className="rounded-[20px] bg-rose-50/50 p-5 ring-1 ring-rose-100">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-rose-500" />
                            <h4 className="text-[14px] font-bold text-rose-900">피해야 할 특징</h4>
                        </div>
                        <ul className="mt-4 space-y-2.5">
                            {profile.avoidKeywords.map((keyword, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[14px]">
                                    <span className="mt-0.5 text-[12px] font-bold text-rose-500/50">•</span>
                                    <span className="font-semibold text-rose-900/80">{keyword}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
