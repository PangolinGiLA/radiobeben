import * as ytdl from "ytdl-core"
import * as path from "path"
import * as ffmpeg from "fluent-ffmpeg"
import * as normalize from "ffmpeg-normalize"
import * as hasha from "hasha"
import * as fs from "fs"
import { cfg } from "../config/general";

interface QueueElement {
    ytid: string,
    resolve: (value: string | PromiseLike<string>) => void,
    reject: (reason?: any) => void
}

export class SongManager {
    downloadQueue: QueueElement[] = [];
    running: boolean = false;
    private download(ytid: string): Promise<string> {
        console.log("started downloading ", ytid);
        return new Promise<string>((resolve, reject) => {
            let stream = ytdl(ytid, {
                quality: 'highestaudio',
            });
            let filename = ytid + ".TEMP.mp3";
            filename = path.join(cfg.song_folder, filename);
            ffmpeg(stream)
                .audioBitrate(128)
                .save(filename)
                .on('end', () => {
                    console.log("done downloading!");
                    resolve(filename);
                });
        });
    }

    private downloadFromQueue() {
        if (this.downloadQueue[0]) {
            let toDownload = this.downloadQueue[0];
            this.downloadQueue.shift();
            this.running = true;
            this.download(toDownload.ytid).then(filename => {
                this.processDownloaded(filename).then(new_name => {
                    toDownload.resolve(new_name);
                })
                    .catch(err => {
                        toDownload.reject(err);
                    });
                this.downloadFromQueue();
            });
        } else {
            this.running = false;
        }

    }
    private normalizeSong(old_filepath: string, new_filepath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            normalize({
                input: old_filepath,
                output: new_filepath,
                loudness: {
                    normalization: 'ebuR128',
                    target:
                    {
                        input_i: -23,
                        input_lra: 7.0,
                        input_tp: -2.0
                    }
                },
                verbose: false
            })
                .then(normalized => {
                    console.log("done normalizing!");
                    resolve("done");
                })
                .catch(error => {
                    reject("normalization failed!");
                });
        })
    }
    private hashFile(filepath: string): Promise<string> {
        return new Promise<string>((resolve) => {
            hasha.fromFile(filepath, { algorithm: "md5" }).then(hash => {
                resolve(hash);
            });
        });
    }

    private processDownloaded(filepath: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            let hash = await this.hashFile(filepath);
            hash = hash + ".mp3";
            let hash_path = path.join(cfg.song_folder, hash);
            if (!fs.existsSync(hash_path)) {
                this.normalizeSong(filepath, path.join(cfg.song_folder, hash)).then(done => {
                    fs.unlink(filepath, nothing => { }); // delete original file
                    resolve(hash);
                })
                    .catch(err => {
                        fs.unlink(filepath, nothing => { }); // delete original file
                        reject(err);
                    });
            } else {
                fs.unlink(filepath, nothing => { }); // delete original file
                reject("this song is already in your library!");
            }

        });
    }

    public DownloadQueue(ytid: string): Promise<string> {
        var promise = new Promise<string>((resolve, reject) => {
            this.downloadQueue.push({ ytid: ytid, resolve: resolve, reject: reject });
            console.log("added to queue!");
            if (!this.running)
                this.downloadFromQueue();
        });
        return promise;
    }

}