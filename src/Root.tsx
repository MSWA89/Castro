import React from "react";
import { Composition } from "remotion";
import { BisognoOpener, openerSchema } from "./BisognoOpener";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BisognoOpener"
      component={BisognoOpener}
      durationInFrames={780} // 26s @ 30fps
      fps={30}
      width={1080}
      height={1920}
      schema={openerSchema}
      defaultProps={{
        hookLine: "Besoin de quelqu'un. Maintenant.",
        needs: [
          "Réparer la fuite avant les invités.",
          "Promener Médor. Encore.",
          "Parler couramment « meuble suédois ».",
          "Régler mes fixations. La neige n'attend pas.",
        ],
        defLabel: "ça veut dire",
        defWord: "( italien ) — besoin",
        mech1: "Un besoin ?",
        mech2: "Un message.",
        mechClose: "Vous écrivez. Genève répond.",
        payoffQ: "Le meuble suédois ?",
        payoffStamp: "Monté \u2713",
        tagline: "Dis ton besoin.",
        cta: "Bientôt à Genève",
        withAudio: false,
      }}
    />
  );
};
