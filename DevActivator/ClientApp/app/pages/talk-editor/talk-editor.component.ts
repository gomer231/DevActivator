import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { LABELS, LayoutService, PATTERNS } from "@dotnetru/core";
import { IAutocompleteRow } from "@dotnetru/shared/autocomplete";
import { Subscription } from "rxjs";

import { ITalk } from "./interfaces";
import { TalkEditorService } from "./talk-editor.service";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TalkEditorService],
    selector: "mtp-talk-editor",
    styleUrls: ["./talk-editor.component.css"],
    templateUrl: "./talk-editor.component.html",
})
export class TalkEditorComponent implements OnInit, OnDestroy {
    public readonly LABELS = LABELS;
    public readonly PATTERNS = PATTERNS;

    @Input() public set talkId(value: string) {
        this._talkId = value;
        this.editMode = typeof this._talkId === "string" && this._talkId.length > 0;
        this._talkEditorService.fetchTalk(this._talkId);
    }

    @Output() public readonly saved: EventEmitter<ITalk> = new EventEmitter<ITalk>();

    // todo: create service method getDefaultTalk
    public talk: ITalk = {
        description: "",
        id: "",
        speakerIds: [],
        title: "",
    };

    public editMode: boolean = false;

    private _talkId?: string;
    private _subs: Subscription[] = [];

    constructor(
        private _talkEditorService: TalkEditorService,
        private _layoutService: LayoutService,
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef,
    ) { }

    public ngOnInit(): void {
        this._subs = [
            this._activatedRoute.params
                .subscribe((params: Params) => {
                    if (typeof params.talkId === "string") {
                        this.talkId = params.talkId;
                    }
                }),
            this._talkEditorService.talk$
                .subscribe((talk: ITalk) => {
                    this.talk = talk;
                    this._changeDetectorRef.detectChanges();
                }),
        ];
    }

    public ngOnDestroy(): void {
        this._subs.forEach((x) => x.unsubscribe);
    }

    public goBack(): void {
        if (!this._talkEditorService.hasChanges(this.talk)) {
            this._router.navigateByUrl("/talk-list");
        } else {
            this._layoutService.showWarning("Потеря введенных данных предотвращена");
        }
    }

    public save(): void {
        if (this.editMode) {
            this._talkEditorService.updateTalk(this.talk, () => {
                this.saved.emit(this.talk);
            });
        } else {
            this._talkEditorService.addTalk(this.talk);
        }
    }

    public reset(): void {
        this._talkEditorService.reset();
    }

    public onSpeakerSelected(row: IAutocompleteRow, index: number): void {
        this.talk.speakerIds[index] = { speakerId: row.id };
    }

    public removeSpeaker(index: number): void {
        this.talk.speakerIds.splice(index, 1);
    }

    public addSpeaker(): void {
        this.talk.speakerIds.push({ speakerId: "" });
    }
}
