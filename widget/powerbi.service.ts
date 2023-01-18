/**
 * Copyright (c) 2021 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Injectable } from '@angular/core';
import { IFetchResponse } from '@c8y/client';
import { HttpService } from './http.service';
import { PowerBIReports, PowerBISettings } from './powerbi.interface';
export type CachedPowerBIInfo = {
  reports: PowerBIReports;
  activeToken: string;
  settings: PowerBISettings;
};
@Injectable({ providedIn: 'root' })
export class PowerBIService {
  private static readonly cachedInfoDefault: CachedPowerBIInfo = {
    reports: [],
    activeToken: '',
    settings: null
  };
  public path = '';
  private configRequested = false;
  public cachedInfo: CachedPowerBIInfo = JSON.parse(JSON.stringify(PowerBIService.cachedInfoDefault));
  constructor(private http: HttpService) { }
  // Irrelevant for customer scenario, only used to load the navigator node once, if settings are defined
  public setConfigRequestState(): void {
    this.configRequested = true;
  }
  // Irrelevant for customer scenario, only used to load the navigator node once, if settings are defined
  public getConfigRequestState(): boolean {
    return this.configRequested;
  }
  // For checking, if config is defined in microservice
  async getConfig(): Promise<IFetchResponse> {
    const url = `${this.path}/config`;
    return await this.http.Get(url);
  }
  // For saving the configuration, may not be needed if hard coded
  async save(connection: any): Promise<IFetchResponse> {
    const url = `${this.path}/config`;
    return await this.http.Post(url, connection);
  }
  // For deleting the configuration, may not be needed if hard coded
  async delete(): Promise<IFetchResponse> {
    const url = `${this.path}/config`;
    const params = { timeout: 5000 };
    return await this.http.Delete(url, params);
  }
  // May not be needed in customer scenario
  async listWorkspaces(): Promise<IFetchResponse> {
    const url = `${this.path}/groups`;
    return await this.http.Get(url);
  }
  // May not be needed in customer scenario
  async listReports(workspaceId: string): Promise<IFetchResponse> {
    const url = `${this.path}/reports`;
    const params = {
      groupId: workspaceId
    };
    return await this.http.Get(url, params);
  }
  // This is where the embeddingToken is requested
  async embedReport(workspaceId: string, reportId: string): Promise<IFetchResponse> {
    const url = `${this.path}/embedReport`;
    const params = {
      groupId: workspaceId,
      reportId
    };
    return await this.http.Get(url, params);
  }
  flushCache(): any {
    this.cachedInfo = JSON.parse(JSON.stringify(PowerBIService.cachedInfoDefault));
  }
}
